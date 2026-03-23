/**
 * daily-reminders — Supabase Edge Function
 *
 * Triggered by a pg_cron job every morning at 08:00 (BRT = UTC-3 = 11:00 UTC).
 * For each premium user with a verified WhatsApp, it checks:
 *   1. Credit card bills due in ≤ 5 days
 *   2. Overdue receivables (a receber vencidos)
 *   3. Receivables due in ≤ 3 days
 *   4. Goals ≥ 80% complete
 *
 * It only sends a message if there's at least one alert for that user.
 *
 * Cron setup (run in Supabase SQL Editor):
 *   SELECT cron.schedule(
 *     'daily-reminders',
 *     '0 11 * * *',
 *     $$
 *       SELECT net.http_post(
 *         url := 'https://vmkhqtuqgvtcapwmxtov.supabase.co/functions/v1/daily-reminders',
 *         headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
 *         body := '{}'::jsonb
 *       );
 *     $$
 *   );
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN")!;
const META_PHONE_NUMBER_ID = Deno.env.get("META_PHONE_NUMBER_ID")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── WhatsApp Sender ──────────────────────────────────────────────────────────

function normalizeBRPhone(phone: string): string {
  if (phone.startsWith("55") && phone.length === 12) {
    return phone.substring(0, 4) + "9" + phone.substring(4);
  }
  return phone;
}

async function sendWhatsApp(to: string, text: string): Promise<void> {
  const normalized = normalizeBRPhone(to);
  const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: text },
      }),
    });
    const data = await resp.json();
    if (data.error) {
      console.error(`❌ WA Error for ${normalized}:`, JSON.stringify(data.error));
    } else {
      console.log(`✅ Reminder sent to ${normalized}`);
    }
  } catch (e) {
    console.error(`❌ Failed to send to ${normalized}:`, e);
  }
}

// ── Format helpers ───────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function dayLabel(days: number): string {
  if (days === 0) return "HOJE";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

// ── Alert builder per user ───────────────────────────────────────────────────

async function buildAlertsForUser(userId: string): Promise<string[]> {
  const alerts: string[] = [];
  const today = new Date();

  // ── 1. Credit cards due ≤ 5 days ─────────────────────────────────────────
  const { data: cards } = await supabase
    .from("credit_cards")
    .select("id, card_name, due_day")
    .eq("user_id", userId)
    .eq("active", true);

  for (const card of cards || []) {
    if (!card.due_day) continue;
    const dueDate = new Date(today.getFullYear(), today.getMonth(), card.due_day);
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1);
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    if (days <= 5) {
      alerts.push(`💳 Fatura *${card.card_name}* vence ${dayLabel(days)}!`);
    }
  }

  // ── 2. Receivables overdue + due ≤ 3 days ────────────────────────────────
  const { data: receivables } = await supabase
    .from("receivables")
    .select("debtor_name, amount, due_date")
    .eq("user_id", userId)
    .eq("status", "pending");

  for (const r of receivables || []) {
    if (!r.due_date) continue;
    const dueDate = new Date(r.due_date);
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

    if (days < 0) {
      alerts.push(
        `⚠️ Cobrança ATRASADA: *${r.debtor_name}* deve ${fmt.format(Number(r.amount))} há ${Math.abs(days)} dia${Math.abs(days) > 1 ? "s" : ""}.`
      );
    } else if (days <= 3) {
      alerts.push(
        `🔔 Cobrar *${r.debtor_name}*: ${fmt.format(Number(r.amount))} vence ${dayLabel(days)}.`
      );
    }
  }

  // ── 3. Goals ≥ 80% ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: goals } = await (supabase as any)
    .from("goals")
    .select("name, current_amount, target_amount")
    .eq("user_id", userId)
    .eq("status", "in_progress");

  for (const g of goals || []) {
    const progress = Number(g.current_amount) / Number(g.target_amount);
    if (progress >= 0.8 && progress < 1) {
      const missing = Number(g.target_amount) - Number(g.current_amount);
      alerts.push(
        `🎯 Meta *${g.name}* quase lá! Faltam apenas ${fmt.format(missing)}.`
      );
    }
  }

  return alerts;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow manual trigger via GET or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  console.log("🌅 Daily reminders job started...");

  // Fetch all premium users with a verified WhatsApp
  const { data: whatsappUsers, error } = await supabase
    .from("whatsapp_users")
    .select("user_id, phone_number")
    .eq("is_verified", true);

  if (error || !whatsappUsers?.length) {
    console.log("No WhatsApp users found or error:", error);
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Filter to premium users only
  const userIds = whatsappUsers.map((u: { user_id: string }) => u.user_id);

  const { data: premiumProfiles } = await supabase
    .from("profiles")
    .select("user_id")
    .in("user_id", userIds)
    .eq("subscription_active", true);

  const premiumIds = new Set((premiumProfiles || []).map((p: { user_id: string }) => p.user_id));

  let sentCount = 0;

  for (const wu of whatsappUsers) {
    if (!premiumIds.has(wu.user_id)) continue;

    try {
      const alerts = await buildAlertsForUser(wu.user_id);
      if (alerts.length === 0) {
        console.log(`✅ No alerts for user ${wu.user_id}, skipping.`);
        continue;
      }

      const date = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      const greeting = `☀️ *Bom dia! Aqui estão seus lembretes de hoje, ${date}:*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      const body = alerts.map((a) => `• ${a}`).join("\n\n");
      const footer = `\n\n━━━━━━━━━━━━━━━━━━━━\n_Saldin • Seu assistente financeiro inteligente_ 🚀`;

      await sendWhatsApp(wu.phone_number, greeting + body + footer);
      sentCount++;

      // Small delay to avoid Meta rate limits
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      console.error(`Error processing user ${wu.user_id}:`, e);
    }
  }

  console.log(`🎉 Daily reminders done. Sent ${sentCount} messages.`);
  return new Response(JSON.stringify({ sent: sentCount }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
