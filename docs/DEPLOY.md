# Deploy oficial (GitHub + Netlify + Render + Neon + Cloudinary)

## Frontend — Netlify
- `base = "client"`
- `command = "npm run build"`
- `publish = "dist"`
- Redirect SPA: `/* -> /index.html` (200)

### Variáveis (Netlify)
- `VITE_API_URL=https://petcrushesv1.onrender.com`

## Backend/API — Render
- Build command: `npm run build`
- Start command: `npm run start`
- Health check: `/api/health`

### Variáveis (Render)
- `NODE_ENV=production`
- `SERVE_CLIENT=false`
- `DATABASE_URL=<neon>`
- `CORS_ORIGIN=https://petcrushes.netlify.app`
- `JWT_SECRET=<segredo-forte>`
- `OTP_TTL_MINUTES=10` (opcional)
- `CLOUDINARY_CLOUD_NAME=<cloud>`
- `CLOUDINARY_API_KEY=<key>`
- `CLOUDINARY_API_SECRET=<secret>`

## Banco — Neon
1. Criar projeto no Neon.
2. Copiar `DATABASE_URL` (com `sslmode=require`).
3. Definir `DATABASE_URL` no Render.
4. Rodar schema do Drizzle após publicar backend:
   ```bash
   npm run db:push
   ```

## Mídia — Cloudinary
- Upload sempre server-side via `POST /api/media/upload`.
- Limites:
  - imagem até 10MB
  - vídeo até 60MB
- Saída inclui `url`, `publicId`, `resourceType`, `bytes` e metadados.
