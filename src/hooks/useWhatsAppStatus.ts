
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/backendClient";

export function useWhatsAppStatus(userId: string | undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    return useQuery({
        queryKey: ["whatsapp-status", userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await db
                .from("whatsapp_users")
                .select("phone_number, is_verified, capture_token")
                .eq("user_id", userId)
                .eq("is_verified", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            return data ? {
                connected: data.is_verified,
                number: data.phone_number,
                captureToken: data.capture_token
            } : {
                connected: false,
                number: null,
                captureToken: null
            };
        },
        enabled: !!userId
    });
}
