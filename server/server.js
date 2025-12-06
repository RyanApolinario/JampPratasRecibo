import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigin = process.env.CORS_ORIGIN || '*';

app.use(
    cors({
        origin: allowedOrigin === '*' ? '*' : allowedOrigin,
    })
);

app.use(express.json());

function ensureEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        console.warn(`⚠️ Variável de ambiente ${name} não definida.`);
    }
    return value;
}

const EMAILJS_SERVICE_ID = ensureEnvVar('EMAILJS_SERVICE_ID');
const EMAILJS_TEMPLATE_ID = ensureEnvVar('EMAILJS_TEMPLATE_ID');
const EMAILJS_PUBLIC_KEY = ensureEnvVar('EMAILJS_PUBLIC_KEY');
const EMAILJS_PRIVATE_KEY = ensureEnvVar('EMAILJS_PRIVATE_KEY');

app.get('/health', (_req, res) => {
    res.json({ ok: true });
});

app.post('/api/send-receipt', async (req, res) => {
    try {
        const { recipientEmail, subject, extraMessage, sendCopy, receiptHtml } = req.body || {};

        if (!recipientEmail || !subject || !receiptHtml) {
            return res.status(400).json({
                error: 'Campos obrigatórios: recipientEmail, subject e receiptHtml.',
            });
        }

        if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
            return res.status(500).json({
                error: 'Configuração do EmailJS ausente no servidor.',
            });
        }

        const templateParams = {
            to_email: recipientEmail,
            subject,
            extra_message: extraMessage || '',
            receipt_html: receiptHtml,
            send_copy: sendCopy ? 'sim' : 'nao',
        };

        const payload = {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY,
            template_params: templateParams,
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('❌ Erro ao enviar via EmailJS:', response.status, text);
            return res.status(500).json({ error: 'Erro ao enviar e-mail via EmailJS.' });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('❌ Erro inesperado em /api/send-receipt:', err);
        return res.status(500).json({ error: 'Erro interno ao enviar e-mail.' });
    }
});

app.listen(port, () => {
    console.log(`✅ Servidor JAMP Backend rodando na porta ${port}`);
    console.log(`🌐 CORS_ORIGIN: ${allowedOrigin}`);
});
