# Zoho Mail — secure OAuth integration plan

**Status: foundation only, no active mailbox access.** Never paste Zoho credentials into chat, GitHub, source files, or screenshots. A Client Secret was visible in a shared screenshot; rotation is strongly recommended before enabling any production access.

## Registration
Zoho API Console client type: Server-based Applications. Homepage: https://brasilforce.com.br. Authorized redirect URI (exact): `https://brasilforce.com.br/api/integrations/zoho/callback`. Domain region must match the Zoho account's data center; this initial implementation targets accounts.zoho.com and must be checked before production authorization.

## Server-only configuration (Vercel encrypted environment variables)
- `ZOHO_CLIENT_ID`: client ID (not a password).
- `ZOHO_CLIENT_SECRET`: private secret, **do not reuse a leaked secret**.
- `ZOHO_OAUTH_STATE_SECRET`: independent, random 32+ character secret for signed short-lived state.
Do not add these to NEXT_PUBLIC variables or expose to the browser.

## Routes
- GET `/api/integrations/zoho/start`: requires authenticated admin/superadmin with MFA via existing requireStaff. Creates a 10-minute signed state bound to user and redirects to Zoho authorization with requested account/message read and message create scopes.
- GET `/api/integrations/zoho/callback`: requires same admin privileges; validates signed state, denies provider errors, does not log or expose authorization code. **Returns 202 and does not exchange/store tokens.** No outbound mail is possible yet.

## Must complete before enabling
1. Confirm exact Zoho Mail OAuth scopes and regional API/authorization domains against current official documentation and account permissions.
2. Add a durable one-time state nonce store and reject replay; current signed state only limits expiry and user identity.
3. Add secure encrypted refresh-token storage with strict server-side access control, key rotation, audit logs and disconnect/revoke workflow.
4. Exchange authorization code server-side; never return code, access token or refresh token to browser or logs. Use no-store, safe redirects, no query-string persistence.
5. Implement rate-limited mail read/send with verified sender account, approval of recipients and campaigns, unsubscribe/opt-out handling and idempotent send logs.
6. Verify application administrator access, MFA, CSRF/replay tests, build and end-to-end authorization before any production rollout.
7. Do not create recurring billing or contact suppliers automatically; all outreach must be approved.

This branch is deliberately non-operational for mailbox access until security controls are complete.
