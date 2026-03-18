
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Hotmart token authentication (Security)
const HOTMART_TOKEN = Deno.env.get("HOTMART_WEBHOOK_TOKEN");

Deno.serve(async (req) => {
    try {
        const body = await req.json();
        const authHeader = req.headers.get("h-hotmart-h2s-token");

        // Simple security check
        if (HOTMART_TOKEN && authHeader !== HOTMART_TOKEN) {
            console.error("❌ Unauthorized Hotmart Webhook call.");
            return new Response("Unauthorized", { status: 401 });
        }

        const event = body.event; // e.g., PURCHASE_APPROVED, SUBSCRIPTION_CANCELLATION
        const purchase = body.data?.purchase;
        const buyer = body.data?.buyer;
        const subscription = body.data?.subscription;

        if (!buyer?.email) {
            return new Response("No email provided", { status: 400 });
        }

        const phone = buyer.checkout_phone?.replace(/\D/g, '') || "";
        const isPhoneValid = phone.length >= 10 && phone.length <= 14;

        if (!isPhoneValid && event === 'PURCHASE_APPROVED') {
            console.warn(`⚠️ Invalid phone format for ${buyer.email}: ${buyer.checkout_phone}`);
            // We still proceed, but log it for manual fix.
        }

        console.log(`📦 Hotmart Event: ${event} for ${buyer.email}`);

        // 1. Find User by Email
        const { data: userAuth, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        const targetUser = userAuth.users.find(u => u.email?.toLowerCase() === buyer.email.toLowerCase());

        let userId = targetUser?.id;

        // 2. Handle User Creation if PURCHASE_APPROVED and user not found
        if (event === 'PURCHASE_APPROVED' && !userId) {
            console.log(`👤 Creating new user for ${buyer.email}`);
            
            // Password will be the first 6 digits of the phone or a random string
            const tempPassword = buyer.checkout_phone?.replace(/\D/g, '').substring(0, 6) || Math.random().toString(36).slice(-8);
            
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: buyer.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: buyer.name,
                    phone: buyer.checkout_phone
                }
            });

            if (createError) throw createError;
            userId = newUser.user.id;
        }

        if (!userId) {
            console.warn(`⚠️ User ${buyer.email} not found and event is not creation-triggering.`);
            return new Response("User not found", { status: 200 }); // Still return 200 to Hotmart
        }

        // 3. Log Subscription Event
        await supabaseAdmin.from('user_subscriptions').insert({
            user_id: userId,
            event_type: event,
            transaction_id: purchase?.transaction,
            product_id: body.data?.product?.id,
            plan_name: body.data?.plan?.name,
            amount: purchase?.price?.value,
            currency: purchase?.price?.currency_code,
            status: purchase?.status,
            raw_payload: body
        });

        // 4. Update Profile based on Event
        const isApproved = event === 'PURCHASE_APPROVED';
        const isRevoked = ['PURCHASE_CANCELED', 'SUBSCRIPTION_CANCELLATION', 'REFUNDED', 'CHARGEBACK'].includes(event);
        
        let updateData: any = {};

        if (isApproved) {
            updateData = {
                subscription_active: true,
                subscription_status: 'active',
                hotmart_subscriber_code: subscription?.subscriber_code,
                // Set expiry to 30 days from now if it's a monthly plan
                subscription_expires_at: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString() 
            };
        } else if (isRevoked) {
            updateData = {
                subscription_active: false,
                subscription_status: event.toLowerCase()
            };
        }

        if (Object.keys(updateData).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(updateData)
                .eq('user_id', userId);
            
            if (profileError) console.error("❌ Profile Update Error:", profileError);
        }

        return new Response("OK", { status: 200 });

    } catch (err) {
        console.error("🔥 Webhook Error:", err);
        return new Response(String(err), { status: 500 });
    }
});
