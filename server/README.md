# JAMP Pratas – Backend de Recibos

Backend em Node.js para envio de recibos por e-mail, protegendo **segredos** como:

- credenciais SMTP
- chaves/API secretas (no futuro, se quiser usar EmailJS server-side ou Firebase Admin)

O frontend (seu `index.html`) chama este backend em `/api/send-receipt`.

## ✅ Tecnologias

- Node.js + Express
- Nodemailer (SMTP)
- CORS
- Variáveis de ambiente (dotenv / Coolify)

---

## 📁 Estrutura

```text
jamp-backend/
  ├── package.json
  ├── server.js
  ├── .gitignore
  └── README.md
