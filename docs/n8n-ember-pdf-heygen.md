# Ember PDF → HeyGen n8n workflow

Workflow source: [`n8n-ember-pdf-heygen.workflow.ts`](./n8n-ember-pdf-heygen.workflow.ts)

## What it does

1. Receives Ember `POST` webhook (`ember-pdf-heygen`) with page image URLs + extracted text  
2. OpenAI Vision OCR for thin/scanned pages  
3. OpenAI GPT-4o writes ≤8 spoken scenes (equations spoken aloud)  
4. HeyGen **v2** multi-scene avatar video (PDF page backgrounds)  
5. Polls HeyGen, then calls Ember `/api/lessons/generated-video/callback` with `heygenVideoUrl`  
6. Ember downloads the mp4 into Storage bucket `lesson-videos`

## Credentials (n8n)

| Credential | Type | Notes |
|------------|------|-------|
| **OpenAI account** | OpenAI | Already present; reused |
| **HeyGen API** | HTTP Header Auth | Create if missing: **Name** = `X-Api-Key`, **Value** = your HeyGen API key |

## Static config in workflow

Edit **Normalize payload** Set node:

- `heygenAvatarId` — stock educator avatar (default `Angela-inTshirt-20220820`)
- `heygenVoiceId` — HeyGen voice id

## Ember env

### Production (Vercel)

```bash
N8N_WEBHOOK_URL=https://lukho.app.n8n.cloud/webhook/ember-pdf-heygen
N8N_WEBHOOK_SECRET=<same secret Ember sends and verifies on callback>
APP_URL=https://www.embermaths12.com
```

Generate from **https://www.embermaths12.com/admin**. The generate route builds `callbackUrl` from the request `Host` / `x-forwarded-host`, so n8n posts status updates back to production.

### Local development

Do **not** set `APP_URL=https://www.embermaths12.com` while generating on localhost. That used to send n8n callbacks to production (where the route may not match your local job), leaving the UI stuck on **Queued**.

Local Generate is rejected with 503 unless the browser Host is a public tunnel (e.g. ngrok / Cloudflare Tunnel) so n8n cloud can reach the callback. Options:

1. **Preferred:** Generate on production after deploy.  
2. **Local pipeline:** Open admin via a public tunnel URL, then click Generate — Host becomes the tunnel hostname and callbacks work.

```bash
N8N_WEBHOOK_URL=https://lukho.app.n8n.cloud/webhook/ember-pdf-heygen
N8N_WEBHOOK_SECRET=<same secret Ember sends and verifies on callback>
# Optional fallback for non-callback uses; Generate does not use this for localhost Host
APP_URL=http://localhost:3000
```

Published workflow: https://lukho.app.n8n.cloud/workflow/9rTcoH1qNfCAkFng

1. Attach **HeyGen API** Header Auth (`X-Api-Key`) to Create/Poll nodes if not already  
2. Confirm avatar/voice IDs in **Normalize payload**  
3. Set `N8N_WEBHOOK_SECRET` to a strong shared secret (Ember generate route forwards it; callback verifies it)  
4. Deploy `/api/lessons/generated-video/callback` to production; smoke-check that POST without secret returns **401 JSON** (not HTML 404)

## Note on HeyGen API version

This workflow uses HeyGen **v2** `POST /v2/video/generate` multi-scene `video_inputs` (stable for backgrounds). Migrate to v3 `type: "studio"` before **1 Nov 2026**.
