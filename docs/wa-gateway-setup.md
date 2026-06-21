# WhatsApp gateway — free, self-hosted setup (`kira-wa-gateway`)

The Kira site (on Vercel) calls a **separate always-on service** to push the
booking PDF to the agency owner's WhatsApp. This service is **not** on Vercel —
Baileys needs a persistent WebSocket connection and a saved session that
serverless functions cannot keep alive.

- **Cost: 0** — no per-message fee, no subscription. Baileys is free and uses the
  agency's own WhatsApp number (scan a QR once).
- **Trade-off:** Baileys is unofficial (emulates WhatsApp Web). For low volume
  (one booking notification to the owner) the ban risk is low; prefer a dedicated
  number. The session can drop and need a re-scan — that's the price of free.
- **The site never hard-depends on it:** if the gateway is down a booking still
  succeeds; delivery is retried and the owner can be emailed via Resend.

The Kira side already speaks to it through `lib/wa-gateway.ts`. This document is
the **contract** that side expects, plus a ready-to-run reference implementation
and a no-code alternative.

---

## API contract (what `lib/wa-gateway.ts` calls)

All requests authenticated with header `x-api-key: <WA_GATEWAY_API_KEY>`.

| Method | Path             | Body / Result                                                        |
| ------ | ---------------- | -------------------------------------------------------------------- |
| `POST` | `/send-document` | `{ to, fileUrl, filename, caption? }` → `200 {ok:true}` or `4xx/5xx` |
| `GET`  | `/status`        | `{ connected: boolean }`                                             |
| `GET`  | `/qr`            | HTML/PNG of the current pairing QR (first-time login)                |

- `to`: recipient phone, digits only, international format (e.g. `2126…`).
- `fileUrl`: a publicly fetchable URL of the PDF (Kira passes a Supabase signed
  URL). The gateway downloads it and sends it as a WhatsApp document.

---

## Option A — Reference Baileys gateway (full control, recommended)

A separate tiny repo/folder `kira-wa-gateway/` deployed on the always-on host.

```
kira-wa-gateway/
├─ src/
│  ├─ index.ts        # Express server + Baileys socket bootstrap
│  └─ baileys.ts      # makeWASocket + auth state + reconnect + send/QR
├─ auth_info_baileys/ # saved session (persist this dir!)
├─ package.json
├─ Dockerfile
└─ .env               # API_KEY, PORT
```

### `package.json`

```json
{
  "name": "kira-wa-gateway",
  "private": true,
  "type": "module",
  "scripts": { "start": "tsx src/index.ts" },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.0",
    "express": "^4.21.0",
    "pino": "^9.0.0",
    "qrcode": "^1.5.4",
    "tsx": "^4.22.4"
  }
}
```

### `src/baileys.ts`

```ts
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";

let sock: WASocket | null = null;
let currentQR: string | null = null;

export function isConnected() {
  return Boolean(sock?.user);
}
export function getQR() {
  return currentQR;
}

export async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  sock = makeWASocket({ auth: state, logger: pino({ level: "warn" }) });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u) => {
    if (u.qr) currentQR = u.qr;
    if (u.connection === "open") currentQR = null;
    if (u.connection === "close") {
      const code = (u.lastDisconnect?.error as Boom)?.output?.statusCode;
      // Reconnect unless the session was explicitly logged out.
      if (code !== DisconnectReason.loggedOut) startSocket();
    }
  });
}

export async function sendDocument(p: {
  to: string;
  fileUrl: string;
  filename: string;
  caption?: string;
}) {
  if (!sock?.user) throw new Error("not_connected");
  const jid = `${p.to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
  await sock.sendMessage(jid, {
    document: { url: p.fileUrl },
    mimetype: "application/pdf",
    fileName: p.filename,
    caption: p.caption,
  });
}
```

### `src/index.ts`

```ts
import express from "express";
import QRCode from "qrcode";
import { startSocket, sendDocument, isConnected, getQR } from "./baileys.js";

const app = express();
app.use(express.json());

// Shared-secret auth on every route except the QR pairing screen.
app.use((req, res, next) => {
  if (req.path === "/qr") return next();
  if (req.header("x-api-key") !== process.env.API_KEY)
    return res.status(401).json({ ok: false, reason: "unauthorized" });
  next();
});

app.get("/status", (_req, res) => res.json({ connected: isConnected() }));

app.get("/qr", async (_req, res) => {
  const qr = getQR();
  if (!qr)
    return res.send(
      isConnected() ? "Already connected ✅" : "No QR yet, refresh…",
    );
  res.type("html").send(`<img src="${await QRCode.toDataURL(qr)}" />`);
});

app.post("/send-document", async (req, res) => {
  try {
    await sendDocument(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e) });
  }
});

const port = Number(process.env.PORT ?? 8080);
startSocket().then(() =>
  app.listen(port, () => console.log(`gateway on :${port}`)),
);
```

### `Dockerfile`

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

> Persist `auth_info_baileys/` (a Docker volume or host bind mount) so the
> WhatsApp session survives restarts and you don't re-scan the QR every deploy.

### Deploy + pair

1. Copy the folder to the always-on host (Oracle Cloud Always Free / Pi / VPS).
2. Create `.env`: `API_KEY=<long-random>` (must equal Vercel's
   `WA_GATEWAY_API_KEY`), `PORT=8080`.
3. `docker build -t kira-wa . && docker run -d --restart=always -p 8080:8080 \
-v $PWD/auth_info_baileys:/app/auth_info_baileys --env-file .env kira-wa`
   (or `pnpm install && pnpm start` under `pm2`/systemd for auto-restart).
4. Put HTTPS in front: Caddy/Nginx + Let's Encrypt, or a **Cloudflare Tunnel**
   (no open ports needed) → public URL e.g. `https://wa.<domain>`.
5. Open `https://wa.<domain>/qr` and **scan with the agency's WhatsApp**
   (WhatsApp → Linked devices → Link a device). Once `/status` returns
   `{connected:true}` you're done.
6. In Vercel set `WA_GATEWAY_URL=https://wa.<domain>`, the matching
   `WA_GATEWAY_API_KEY`, `AGENCY_WHATSAPP_NUMBER` and redeploy.

---

## Option B — Evolution API (no code)

Prefer not to maintain code? Run the **Evolution API** Docker image (a REST
wrapper around Baileys), create an instance, scan its QR, and point
`lib/wa-gateway.ts` at its `/message/sendMedia` endpoint instead. Same idea,
zero custom code, slightly heavier image. See the Evolution API docs for the
exact route + auth header; map `to/fileUrl/filename/caption` accordingly.

---

## Operations

- **Health:** `GET /status` — wire it into the uptime monitor (see
  `production-launch.md`). Alert if `connected:false`.
- **Re-pairing:** if the session drops (phone offline too long, WhatsApp logout),
  re-open `/qr` and scan again. Bookings made while down are not lost — they're
  marked `whatsapp_sent=false` and retried / emailed.
- **Idempotency:** Kira guards on `bookings.whatsapp_sent` so a PDF is never sent
  twice for the same booking.
- **Anti-ban hygiene:** only the owner is messaged (no broadcasts/marketing), use
  a dedicated number, keep volume low.
