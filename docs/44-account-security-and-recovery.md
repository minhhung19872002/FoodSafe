# Account Security and Recovery — FoodSafe

## Authentication boundary

The SPA uses an ASP.NET Identity application cookie. Credentials and session
tokens are not stored in browser storage. Every state-changing browser request
uses the `XSRF-TOKEN` cookie and `RequestVerificationToken` header. A fresh
anti-forgery token is obtained after the authenticated principal changes.

Account controls include:

- five failed attempts followed by a 30-minute lockout;
- a 30-minute sliding session;
- password complexity, five-password history, and 90-day expiry;
- forced password change for marked or expired accounts;
- login throttling and tighter password-recovery throttling;
- disabled self-registration and hard `404` registration routes.

## Login CAPTCHA

The login page retrieves only the Turnstile site key and action from
`GET /api/security/captcha/config`. The secret remains server-side.

For every `POST /api/account/login`, middleware:

1. extracts a bounded `captchaToken`;
2. sends it to Cloudflare's HTTPS Siteverify endpoint with the client address
   and a unique idempotency key;
3. fails closed on a missing token, provider error, timeout, or malformed
   response;
4. in Production, requires exact action and hostname matches before allowing
   Identity login.

Production startup rejects published test keys, a blank expected hostname, and
non-HTTPS verifier URLs. CAPTCHA failure returns the structured
`FoodSafe:Captcha:0001` error without exposing the secret or provider payload.

## Password recovery

The forgot-password page submits the same generic response for a valid or
unknown address, preventing account enumeration. ABP generates a time-bound,
user-bound reset token and sends a link based on the configured public client
URL. The reset page verifies the link before accepting a new password and then
uses the normal Identity password policy.

Development delivery uses the pinned Mailpit service in the Compose
`development` profile. Production startup requires an SMTP host, from address,
TLS, and explicit credentials unless platform-managed default credentials are
deliberately selected. Delivery uses ABP's MailKit integration rather than the
legacy .NET `SmtpClient`.

ABP 9.3.7 was compiled against a vulnerable Scriban 6 line. FoodSafe resolves
the graph to patched Scriban 7.2.5 and supplies a locally compiled rendering
adapter with a public-property-only member filter. This retains password-email
rendering without reintroducing the vulnerable runtime. Remove the adapter
after moving to an ABP line that natively supports a non-vulnerable Scriban
release.

## Verified evidence

On 2026-07-25:

- missing CAPTCHA login returned `400`; a server-verified test token completed
  login and established the expected authenticated session;
- direct verifier tests covered provider failure, token bounds, request fields,
  and Production action/hostname binding;
- Production processes refused published CAPTCHA keys and insecure SMTP
  configuration before serving traffic;
- a disposable account completed request → captured email → link parsing →
  token verification → password reset → login with the new password;
- the disposable account was deleted after validation;
- backend solution build passed with zero warnings and 36 tests; frontend lint,
  11 tests, and production build passed.
