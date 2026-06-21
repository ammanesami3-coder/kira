# Backup & disaster-recovery strategy

What to back up, how often, and how to restore — per deployment. Kira's state
lives in three places; protect each.

| Data                         | Lives in                          | Criticality   |
| ---------------------------- | --------------------------------- | ------------- |
| Database (cars, bookings, …) | Supabase Postgres                 | **High**      |
| Images + booking PDFs        | Supabase Storage                  | **High**      |
| Site code + config           | Git (GitHub) + Vercel env         | Medium        |
| WhatsApp session             | Gateway host `auth_info_baileys/` | Low (re-scan) |

---

## 1. Database (Supabase Postgres)

- **Automated:** Supabase takes daily backups (retention depends on plan — Free:
  short window/PITR limited; Pro: daily + Point-in-Time Recovery). For a real
  business, the **Pro plan with PITR is strongly recommended.**
- **Manual / off-site (recommended weekly):** export a full SQL dump and store it
  off Supabase (e.g. private GitHub repo, Google Drive, S3):
  ```bash
  # connection string from Supabase → Project Settings → Database
  pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges -f kira-backup-$(date +%F).sql
  ```
- **Automate it (free):** a GitHub Actions cron (weekly) running the `pg_dump`
  above with the DB URL stored as an encrypted Actions secret, committing the
  dump to a private backup repo or uploading it to storage.

### Restore

```bash
psql "$SUPABASE_DB_URL" -f kira-backup-YYYY-MM-DD.sql
```

Or use Supabase's dashboard backup/PITR restore to a chosen timestamp.

---

## 2. Storage (images + booking PDFs)

Supabase Storage is **not** included in the SQL dump. Back the buckets up
separately:

- Buckets: `car-images` (public) and the booking-PDFs bucket (private/signed).
- **Periodic sync (monthly, or after large fleet updates):**
  ```bash
  pnpm dlx supabase storage download --recursive car-images ./backup/car-images
  ```
  (or use the Storage S3-compatible endpoint with `rclone`/`aws s3 sync`).
- Booking PDFs can be regenerated from booking data if lost, but archiving them
  is cheap insurance.

---

## 3. Code & configuration

- **Code:** every deployment has its own GitHub repo — that _is_ the code backup.
  Tag each go-live (`git tag v1.0-<agency>`).
- **Environment variables:** Vercel stores them, but they're not in Git. Keep an
  **encrypted** copy per client (password manager / 1Password / Bitwarden) — you
  need them to rebuild the project from scratch. Never commit real secrets;
  `.env.example` documents the shape only.

---

## 4. WhatsApp session

The gateway's `auth_info_baileys/` is the saved WhatsApp login. If lost, just
**re-scan the QR** — no data loss. Still, back the folder up if you want to avoid
re-pairing after a host rebuild. Persist it on a Docker volume / host mount.

---

## 5. Recommended schedule

| Asset                | Frequency                   | Method                         |
| -------------------- | --------------------------- | ------------------------------ |
| Postgres (automated) | Daily                       | Supabase backups / PITR        |
| Postgres (off-site)  | Weekly                      | `pg_dump` → private repo/drive |
| Storage              | Monthly / after big changes | `supabase storage download`    |
| Env vars             | On every change             | Password manager               |
| Code                 | Continuous                  | Git push + release tag         |

## 6. Recovery drill (do once per client)

Verify backups actually restore: spin up a throwaway Supabase project, load the
latest dump + storage sync, point a Vercel preview at it, and confirm the
catalog and a booking render. A backup you've never restored is a hope, not a
plan.
