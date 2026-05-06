/**
 * Test Meta WhatsApp API Token
 * Run this with: deno run --allow-net --allow-env test_meta_token.ts
 */

const META_ACCESS_TOKEN = "YOUR_TOKEN_HERE"; // Put your token here to test manually
const META_PHONE_NUMBER_ID = "YOUR_PHONE_ID_HERE";
const RECIPIENT_PHONE = "556184585912"; // Test number

async function testConnection() {
    console.log("🚀 Testing Meta API Connection...");
    
    const url = `https://graph.facebook.com/v22.0/${META_PHONE_NUMBER_ID}/messages`;
    
    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${META_ACCESS_TOKEN}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: RECIPIENT_PHONE,
                type: "text",
                text: { body: "🤖 Teste de conexão do Saldin Agent" }
            })
        });

        const data = await resp.json();
        
        if (resp.ok) {
            console.log("✅ SUCCESS! Message sent.");
            console.log("Response:", JSON.stringify(data, null, 2));
        } else {
            console.error(`❌ FAILED with status ${resp.status}`);
            console.error("Error Details:", JSON.stringify(data, null, 2));
            
            if (data.error?.code === 190) {
                console.error("💡 HINT: Your access token has expired or is invalid.");
            } else if (data.error?.code === 131030) {
                console.error("💡 HINT: Recipient phone number not in allowlist (if using trial number).");
            }
        }
    } catch (err) {
        console.error("❌ Fatal Error:", err);
    }
}

testConnection();
