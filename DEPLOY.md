# GROQ.CHAT — Panduan Deploy

## File yang kamu punya:
- `worker.js`  → Backend (Cloudflare Workers)
- `index.html` → Frontend (Cloudflare Pages)

---

## STEP 1 — Deploy Worker (Backend)

1. Buka https://dash.cloudflare.com
2. Klik **Workers & Pages** → **Create** → **Create Worker**
3. Hapus kode default, paste seluruh isi `worker.js`
4. Klik **Deploy**
5. Setelah deploy, klik **Settings** → **Variables and Secrets**
6. Tambah variable:
   - Name  : `GROQ_API_KEY`
   - Value : `sk-xxxxxxxxxxxxxxxx` (API key Groq kamu)
   - Klik **Encrypt** lalu **Save**
7. **Copy URL worker** — contoh: `https://groq-proxy.namaakun.workers.dev`

---

## STEP 2 — Edit index.html

Buka `index.html`, cari baris ini (sekitar baris 10 dari bawah di bagian `<script>`):

```js
const WORKER_URL = 'https://YOUR_WORKER.workers.dev/chat';
```

Ganti dengan URL worker kamu + `/chat`:
```js
const WORKER_URL = 'https://groq-proxy.namaakun.workers.dev/chat';
```

---

## STEP 3 — Deploy Frontend (Cloudflare Pages)

1. Di dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages**
2. Pilih **Upload assets** (direct upload, ga perlu GitHub)
3. Upload file `index.html`
4. Klik **Deploy site**
5. Selesai! Lo dapat URL seperti: `https://groq-chat.pages.dev`

---

## Catatan Penting

- **API key aman** — tersimpan di Worker environment, tidak exposed ke user
- **Free tier Cloudflare** cukup untuk ribuan request/hari
- **Free tier Groq** cukup generous — cek limit di console.groq.com
- Kalau mau custom domain, bisa set di Cloudflare Pages → Custom domains
