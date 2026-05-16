# Limitless Chat

Drietalige zakelijke chat-app: **Nederlands · Darija Marokkaans · Frans**

Realtime berichten worden automatisch vertaald via de OpenAI API.

---

## Lokaal opstarten

### 1. Dependencies installeren

```bash
npm run install:all
```

### 2. Omgevingsvariabelen instellen

Kopieer `.env.example` naar `.env` (of pas `.env` direct aan):

```env
OPENAI_API_KEY=sk-...              # OpenAI API sleutel voor vertalingen
ADMIN_CREDENTIALS=linda:wachtwoord,sarah:wachtwoord2   # Beheerders naam:wachtwoord
JWT_SECRET=verander-dit-in-productie
PORT=3001
CLIENT_URL=http://localhost:5173
APP_URL=http://localhost:5173      # Basis-URL voor uitnodigingslinks
```

### 3. Starten

```bash
npm run dev
```

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

---

## Deployen naar Railway.app (gratis)

Railway geeft je een echte URL zoals `https://limitless-chat.up.railway.app`.

### Stap 1 — Account aanmaken

Ga naar [railway.app](https://railway.app) en log in met GitHub.

### Stap 2 — Project aanmaken

1. Klik op **New Project → Deploy from GitHub repo**
2. Selecteer je `limitless-chat` repository
3. Railway detecteert automatisch Node.js

### Stap 3 — Build & start commando instellen

Ga naar **Settings → Deploy** en stel in:

| Veld | Waarde |
|------|--------|
| Build Command | `npm run install:all && npm run build --prefix client` |
| Start Command | `node server/index.js` |

### Stap 4 — Omgevingsvariabelen instellen

Ga naar **Variables** en voeg toe:

```
NODE_ENV=production
OPENAI_API_KEY=sk-...
ADMIN_CREDENTIALS=linda:jouwwachtwoord,sarah:wachtwoord2
JWT_SECRET=een-lang-willekeurig-geheim
PORT=3001
APP_URL=https://jouw-app-naam.up.railway.app
```

> **Let op:** Zet `APP_URL` op je echte Railway-URL. Zo werken uitnodigingslinks automatisch correct.

### Stap 5 — Persistente opslag instellen (database)

NeDB slaat data op in bestanden. Op Railway moet je een **Volume** koppelen zodat data niet verloren gaat bij herstart:

1. Ga naar **Add Service → Volume**
2. Koppel het volume aan `/app/server/data`
3. Voeg de variabele toe: `DB_PATH=/app/server/data/limitless.db`

### Stap 6 — Deploy

Klik op **Deploy**. Na ±2 minuten is de app live.

---

## Deployen naar Render.com (gratis)

### Stap 1 — Account aanmaken

Ga naar [render.com](https://render.com) en log in met GitHub.

### Stap 2 — Web Service aanmaken

1. Klik op **New → Web Service**
2. Verbind je GitHub repository
3. Kies **Node** als runtime

### Stap 3 — Build & start instellen

| Veld | Waarde |
|------|--------|
| Build Command | `npm run install:all && npm run build --prefix client` |
| Start Command | `node server/index.js` |

### Stap 4 — Omgevingsvariabelen

Voeg dezelfde variabelen toe als bij Railway (zie boven).  
Zet `APP_URL` op je Render-URL, bijv. `https://limitless-chat.onrender.com`.

### Stap 5 — Persistente disk

1. Ga naar **Disks → Add Disk**
2. Mount path: `/data`
3. Voeg variabele toe: `DB_PATH=/data/limitless.db`

> **Gratis tier:** Render zet de app na 15 minuten inactiviteit in slaapstand. De eerste aanvraag na inactiviteit duurt ±30 seconden. Voor continue beschikbaarheid: upgrade naar de betaalde tier.

---

## Omgevingsvariabelen — overzicht

| Variabele | Beschrijving | Voorbeeld |
|-----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI sleutel voor vertalingen | `sk-proj-...` |
| `ADMIN_CREDENTIALS` | Beheerders `naam:wachtwoord`, kommagescheiden | `linda:pass1,sarah:pass2` |
| `JWT_SECRET` | Geheim voor JWT-tokens (lang en willekeurig) | `abc123xyz...` |
| `APP_URL` | Publieke URL van de app (voor uitnodigingslinks) | `https://jouw-app.up.railway.app` |
| `PORT` | Server poort | `3001` |
| `CLIENT_URL` | Frontend URL (CORS) | `https://jouw-app.up.railway.app` |
| `DB_PATH` | Pad naar database | `./data/limitless.db` |

---

## Functies

- Realtime chat via Socket.io
- Automatische vertaling NL ↔ Darija (Arab + Franco) ↔ FR
- Meerdere beheerders met eigen naam en wachtwoord
- Privé Admin Kanaal (beheerders onderling)
- Uitnodigingslinks per project (WhatsApp-klaar)
- Contact verwijderen met bevestiging
- Bestandsupload (PDF, DOCX, XLSX, afbeeldingen, audio)
- Spraakberichten

## Tech Stack

| Laag | Technologie |
|------|-------------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express + Socket.io |
| Database | NeDB (bestandsgebaseerd) |
| AI Vertaling | OpenAI `gpt-4o-mini` |
