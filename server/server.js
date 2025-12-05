import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const port = process.env.PORT || 3000;

// CORS – ajuste depois para o domínio real do front
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
  })
);

app.use(express.json());

// ---------- SMTP (seguro no backend) -------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // ex: "smtp.hostinger.com"
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------- Helpers ------------------------------
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function numberToCurrency(value) {
  const num = Number(value) || 0;
  return num
    .toFixed(2)
    .replace('.', ',')
    .replace(/(\d)(?=(\d{3})+\,)/g, '$1.');
}

function formatDatePtBr(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTimePtBr(dateInput) {
  let date;
  if (!dateInput) {
    date = new Date();
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const data = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${data} às ${hora}`;
}

function buildReceiptHtml(order, extraMessage = '') {
  const {
    id,
    clientName,
    phone,
    description,
    ringSize,
    engraving,
    value,
    deliveryDate,
    paymentStatus,
    paymentMethod,
    downPayment,
    observations,
    createdAt,
    createdByName,
  } = order || {};

  const orderIdShort = (id || '').toString().slice(-6);
  const createdAtText = formatDateTimePtBr(createdAt);
  const deliveryText = formatDatePtBr(deliveryDate);
  const total = numberToCurrency(value);
  const entrada = numberToCurrency(downPayment || 0);
  const pendenteNum = (Number(value) || 0) - (Number(downPayment) || 0);
  const pendente = numberToCurrency(pendenteNum);

  const paymentStatusText =
    paymentStatus === 'pago'
      ? 'PAGO'
      : paymentStatus === '50%'
      ? '50% PAGO'
      : 'PENDENTE';

  const paymentMethodText = paymentMethod || 'Não informado';

  const logoUrl =
    process.env.LOGO_URL ||
    'https://seu-dominio.com/logo-jamp.webp'; // troque por env no Coolify

  const safeExtraMessage = escapeHtml(extraMessage);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recibo - JAMP Pratas</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:800px;margin:0 auto;background:#ffffff;padding:24px;">
    ${
      safeExtraMessage
        ? `
    <div style="margin-bottom:16px;padding:12px;border:1px solid #eee;background:#fafafa;font-size:14px;color:#333;">
      ${safeExtraMessage}
    </div>
    `
        : ''
    }

    <div style="text-align:center;padding-bottom:24px;margin-bottom:24px;border-bottom:3px solid #1a1a1a;">
      <img src="${logoUrl}" alt="JAMP Pratas" style="max-width:260px;height:auto;display:block;margin:0 auto 16px;background:#000000;">
      <div style="font-size:12px;color:#777;letter-spacing:2px;margin-bottom:4px;">
        PEDIDO #${escapeHtml(orderIdShort)}
      </div>
      <div style="font-size:14px;color:#333;font-weight:bold;">
        ${escapeHtml(createdAtText)}
      </div>
    </div>

    <div style="margin-bottom:24px;padding:16px;background:#f8f8f8;border-radius:8px;">
      <h3 style="margin:0 0 12px 0;font-size:18px;color:#1a1a1a;border-bottom:2px solid #D4AF37;padding-bottom:8px;">
        Informações do Cliente
      </h3>

      <div style="padding:8px 0;border-bottom:1px solid #e0e0e0;font-size:14px;">
        <strong style="display:inline-block;min-width:120px;color:#666;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;">Cliente:</strong>
        <span style="color:#111;font-weight:500;">${escapeHtml(clientName || '')}</span>
      </div>

      <div style="padding:8px 0;border-bottom:1px solid #e0e0e0;font-size:14px;">
        <strong style="display:inline-block;min-width:120px;color:#666;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;">Telefone:</strong>
        <span style="color:#111;font-weight:500;">${escapeHtml(phone || '')}</span>
      </div>

      <div style="padding:8px 0;border-bottom:1px solid #e0e0e0;font-size:14px;">
        <strong style="display:inline-block;min-width:120px;color:#666;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;">Descrição:</strong>
        <span style="color:#111;font-weight:500;">${escapeHtml(description || '')}</span>
      </div>

      ${
        ringSize
          ? `
      <div style="padding:8px 0;border-bottom:1px solid #e0e0e0;font-size:14px;">
        <strong style="display:inline-block;min-width:120px;color:#666;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;">Numeração:</strong>
        <span style="color:#111;font-weight:500;">${escapeHtml(ringSize)}</span>
      </div>
      `
          : ''
      }

      ${
        engraving
          ? `
      <div style="padding:8px 0;font-size:14px;">
        <strong style="display:inline-block;min-width:120px;color:#666;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;">Gravação:</strong>
        <span style="color:#111;font-weight:500;">${escapeHtml(engraving)}</span>
      </div>
      `
          : ''
      }
    </div>

    <div style="margin-bottom:24px;padding:16px;background:#f8f8f8;border-radius:8px;min-height:80px;">
      <h3 style="margin:0 0 12px 0;font-size:18px;color:#1a1a1a;border-bottom:2px solid #D4AF37;padding-bottom:8px;">
        Observações Adicionais
      </h3>
      <div style="font-size:14px;line-height:1.6;color:#333;">
        ${escapeHtml(observations || 'Nenhuma observação adicional.')}
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
      <div style="flex:1;min-width:220px;padding:16px;background:#f8f8f8;border-radius:8px;">
        <h4 style="margin:0 0 12px 0;font-size:16px;color:#1a1a1a;">Pagamento</h4>
        <div style="margin-bottom:8px;font-size:13px;">
          <strong style="display:block;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Forma de Pagamento:</strong>
          <span style="color:#111;font-weight:500;">${escapeHtml(
            `${paymentMethodText} - ${paymentStatusText}`
          )}</span>
        </div>
        <div style="margin-bottom:8px;font-size:13px;">
          <strong style="display:block;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Entrada:</strong>
          <span style="color:#111;font-weight:500;">R$ ${entrada}</span>
        </div>
        <div style="font-size:13px;">
          <strong style="display:block;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Valor Pendente:</strong>
          <span style="color:#111;font-weight:500;">R$ ${pendente}</span>
        </div>
      </div>

      <div style="flex:1;min-width:220px;padding:16px;background:#1a1a1a;color:#ffffff;border-radius:8px;text-align:center;display:flex;flex-direction:column;justify-content:center;">
        <div style="font-size:11px;color:#D4AF37;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">
          Valor Total
        </div>
        <div style="font-size:28px;font-weight:bold;">
          R$ ${total}
        </div>
      </div>
    </div>

    <div style="margin-bottom:24px;padding:16px;background:#f8f8f8;border-radius:8px;text-align:center;">
      <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
        Prazo de Entrega
      </div>
      <div style="font-size:18px;font-weight:bold;color:#1a1a1a;">
        ${escapeHtml(deliveryText)}
      </div>
    </div>

    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:12px;color:#777;text-align:center;">
      Pedido criado por: <strong>${escapeHtml(createdByName || 'N/A')}</strong>
    </div>

    <div style="margin-top:12px;font-size:12px;color:#555;text-align:center;">
      Obrigado pela preferência!<br>
      Siga <strong>@jamppratas</strong>
    </div>
  </div>
</body>
</html>
  `;
}

// ---------- Rotas -------------------

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/send-receipt', async (req, res) => {
  try {
    const { toEmails, subject, extraMessage, order } = req.body || {};

    if (!toEmails || !subject || !order) {
      return res.status(400).json({
        error:
          'Campos obrigatórios: toEmails, subject, order (com dados do pedido).',
      });
    }

    const to =
      Array.isArray(toEmails) && toEmails.length > 0
        ? toEmails.join(', ')
        : String(toEmails);

    const html = buildReceiptHtml(order, extraMessage);

    const mailOptions = {
      from: `"JAMP Pratas" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err);
    return res.status(500).json({ error: 'Erro ao enviar e-mail' });
  }
});

// ---------- Start -------------------
app.listen(port, () => {
  console.log(`✅ Servidor JAMP Backend rodando na porta ${port}`);
});
