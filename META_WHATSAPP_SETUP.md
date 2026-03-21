# Meta WhatsApp Cloud API – Developer / platform setup

**Audience:** Developers and platform operators who configure the CRM and Meta app.  
**End users** should use the in-app guide: **Settings → Integrations → "Follow the step-by-step guide"** (or see `docs/Connect-WhatsApp-Guide.md`).

This document describes how to register a Meta app, obtain WhatsApp Cloud API credentials, and configure webhooks.

---

## 1. Create a Meta app and add WhatsApp

1. Go to [Meta for Developers](https://developers.facebook.com/) and sign in.
2. **My Apps** → **Create App** → **Other** → **Business** → Next.
3. Enter **App name** and **App contact email** → **Create app**.
4. In the app dashboard: **Add Products** → **WhatsApp** → **Set up** (WhatsApp Business Platform / Cloud API).

---

## 2. Environment variables

| Variable                             | Required     | Description                                                                                          |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------- |
| `META_APP_ID`                        | Optional\*   | Meta app ID (Settings → Basic).                                                                      |
| `META_APP_SECRET`                    | Optional\*   | Meta app secret (Settings → Basic).                                                                  |
| `META_WHATSAPP_ACCESS_TOKEN`         | Optional\*\* | WhatsApp access token. Used as app-wide fallback when a company has no stored credential.             |
| `META_WHATSAPP_PHONE_NUMBER_ID`      | Optional\*\* | WhatsApp Cloud API phone number ID. Used with the token above as fallback.                            |
| `META_WHATSAPP_API_VERSION`          | No           | Graph API version (default: `v22.0`).                                                                |
| `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` | No           | String you choose for webhook verification. Default: `vakman-crm-verify`.                            |
| `META_WHATSAPP_JOB_TEMPLATE`         | No           | Template name for job notifications (e.g. `job_confirmation`). When empty, free-form text is used.   |
| `META_WHATSAPP_JOB_TEMPLATE_LANGUAGE`| No           | Must match the template language in Meta exactly (e.g. `en`). Default: `en`.                         |

\* Required only if you use app-level features (e.g. token exchange).  
\*\* Required only if you want one app-wide WhatsApp number without per-company credentials.

**Production:** Use a **permanent (long-lived) access token** from a Meta Business Suite system user (see section 5).

**Development:** You can use the temporary token from **WhatsApp → API Setup** for short tests; it expires in ~24 hours.

---

## 3. Per-company connection (recommended for production)

End users connect their own WhatsApp number via **Settings → Integrations** in the app. They paste:

- **Phone number ID** (from their Meta WhatsApp account / API setup).
- **Access token** (for production, use a **permanent** system user token; see section 5).

Credentials are stored in `whatsapp_credentials` (per company).

---

## 4. Webhook

The app exposes:

- `GET /webhook/whatsapp` – verification (Meta sends `hub.mode`, `hub.verify_token`, `hub.challenge`).
- `POST /webhook/whatsapp` – incoming events (CSRF excluded in `bootstrap/app.php`).

**Production:**

1. Set **Callback URL** in Meta to: `https://your-production-domain.com/webhook/whatsapp`.
2. Set **Verify token** to the same value as `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`.
3. Subscribe to **messages**.

**Development:** Use a tunnel (e.g. ngrok): `https://your-ngrok-url.ngrok.io/webhook/whatsapp`.

---

## 5. Permanent access token (production)

Temporary tokens expire in ~24 hours. For production:

1. **Meta Business Suite** → [business.facebook.com](https://business.facebook.com) → **Business settings** → **Users** → **System users**.
2. Create a system user (or use an existing one), assign it to your app.
3. **Generate new token** → select your app → enable **whatsapp_business_messaging** and **whatsapp_business_management** → Generate.
4. Use this token as `META_WHATSAPP_ACCESS_TOKEN` in `.env` (app-wide) or have users paste it in **Settings → Integrations** (per company).

---

## 6. Business verification (when required)

For certain regions or to use your own phone number with higher limits, Meta may require **business verification**:

1. **Business settings** → **Business info** → **Start verification**.
2. Submit the requested documents. Approval can take several days.
3. After approval, add your phone number in **WhatsApp Manager** and get the **Phone number ID** and a permanent token.

---

## 7. Sending messages

- **Job assignment:** When a job is created with an employee and "Send notification" is checked (or **Send WhatsApp** on the job page), the app uses the company's stored credentials or the env fallback.
- **Template messages:** The `job_confirmation` template uses named content variables (e.g. `{{employee}}`, `{{job_date}}`). The app populates these automatically from job data.

### Error: "Recipient phone number not in allowed list" (#131030)

Your WhatsApp app is in **Development mode**, which only allows sending to numbers in the test recipient list.

**Fix for testing:** Meta for Developers → your app → WhatsApp → API Setup → add the recipient number in E.164 format (e.g. `31612345678`).

**Fix for production:** Complete business verification (section 6) and use an approved production number.

---

## 8. Checklist for going live

- [ ] Meta app created, WhatsApp product added.
- [ ] Production webhook URL set in Meta.
- [ ] `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` set in production `.env`.
- [ ] Permanent access token configured (app-wide or per company via Settings → Integrations).
- [ ] Migrations run: `whatsapp_credentials`, `whatsapp_message_logs` exist.
