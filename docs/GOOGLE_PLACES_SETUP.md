# Google Places Setup (Netlify)

## Variável de ambiente
- `VITE_GOOGLE_MAPS_API_KEY`

## Passos no Google Cloud
1. Criar/selecionar projeto no Google Cloud Console.
2. Ativar APIs:
   - **Maps JavaScript API**
   - **Places API**
3. Criar API Key.
4. Restringir key por **HTTP referrers** (domínios Netlify), por exemplo:
   - `https://seu-site.netlify.app/*`
   - `https://seu-dominio.com/*` (se houver domínio customizado)
5. Restringir key às APIs acima.

## Netlify
1. Site settings → Environment variables.
2. Criar `VITE_GOOGLE_MAPS_API_KEY` com a key.
3. Fazer novo deploy.

## Observações
- Sem key, o app usa fallback manual (country/state/city).
- Não salvar endereço exato/número da casa.
- Billing pode ser necessário dependendo da cota/uso.
