# Cloudinary setup (Render + Netlify)

## API (Render)
Configure these env vars in your Render service:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional but recommended:
- `GOOGLE_CLIENT_ID` (only if Google auth is fully configured)

## Web (Netlify)
No Cloudinary secret should be exposed in frontend.
Use only:
- `VITE_API_URL` (backend base URL)
- `VITE_GOOGLE_CLIENT_ID` (only if Google button should be active)

## Behavior implemented
- If any Cloudinary API env var is missing, `/api/media/upload` returns:
  - HTTP `503`
  - `{ "error": { "code": "CLOUDINARY_NOT_CONFIGURED", "message": "..." } }`
- If Cloudinary is temporarily failing, API returns generic safe error without technical leak.
- Frontend shows human message and allows user to retry upload.

## Quick test

### 1) API health
```bash
curl -i "$API_URL/api/health"
```

### 2) Upload with auth token
```bash
curl -i -X POST "$API_URL/api/media/upload" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/photo.jpg"
```

Expected:
- `200` + JSON with `url` when configured.
- `503` + `CLOUDINARY_NOT_CONFIGURED` if env is missing.

## CORS / origin notes
- Ensure Render API CORS allows your Netlify domain.
- Ensure `VITE_API_URL` points to the same Render API host used in CORS allowlist.
