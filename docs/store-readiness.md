# Damroo AI — Phase 10 store readiness

## Privacy / legal (required for Google + Apple Sign-In)

Update live URLs before submission (also in `app.json` → `extra` and `src/constants/store.ts`):

- Privacy: https://damroo.ai/privacy
- Terms: https://damroo.ai/terms
- Support: https://damroo.ai/support

Paste the privacy URL into:

1. Supabase Auth → Google / Apple provider settings (where required)
2. Google Cloud OAuth consent screen
3. App Store Connect → App Privacy
4. Google Play Console → App content → Privacy policy

## EAS Build

```bash
npm i -g eas-cli
eas login
eas init   # replaces REPLACE_WITH_EAS_PROJECT_ID in app.json
npm run eas:dev      # development client
npm run eas:preview  # internal APK / ad-hoc
npm run eas:prod     # store binaries
```

Profiles: `development` · `preview` · `production` (`eas.json`).

## Apple IAP products (App Store Connect)

Create auto-renewable subscriptions matching:

| Product ID | Plan | Credits |
|---|---|---|
| `damroo_starter_monthly` | Starter | 500 |
| `damroo_growth_monthly` | Growth | 1000 |
| `damroo_scale_monthly` | Scale | 2000 |

Client verifies via Edge Function `verify-apple-iap` with `APPLE_IAP_SHARED_SECRET`.

## Razorpay (Android)

1. Dashboard → Webhooks → add endpoint:

   `https://thvqecpkurkzcmkdqzki.supabase.co/functions/v1/razorpay-webhook`

2. Subscribe to `payment.captured` (and optionally `order.paid`).
3. Set the webhook secret as Edge secret `RAZORPAY_WEBHOOK_SECRET`.
4. Ensure `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` are set as Edge secrets.
5. App uses `EXPO_PUBLIC_RAZORPAY_KEY_ID` for checkout only.

Orders are created by `create-razorpay-order` with plan notes (`user_id`, `plan_id`).

## Cron — expire subscriptions

Schedule a daily POST to:

`https://thvqecpkurkzcmkdqzki.supabase.co/functions/v1/cron-expire-subscriptions`

Header: `x-cron-secret: <CRON_SECRET>`

Zeros credits and marks plans expired after `current_period_end` (no rollover).

## Edge secrets checklist

- `ARK_API_KEY` (+ optional `ARK_BASE_URL`, `ARK_MODEL`)
- `OPENAI_API_KEY`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- `APPLE_IAP_SHARED_SECRET`
- `CRON_SECRET`

## QA checklist

- [ ] Google sign-in (iOS + Android); Apple sign-in (iOS only)
- [ ] New user blocked from tabs until paid onboarding completes
- [ ] Android: Razorpay success → 500 / 1000 / 2000 credits; fail → no grant
- [ ] iOS: IAP success → same credits via `verify-apple-iap`
- [ ] Period end without renew → credits 0 (cron)
- [ ] Generate with 0 credits → blocked + upgrade messaging
- [ ] Multi-reference attachment order preserved in Seedream payload
- [ ] Enhance prompt mutates composer only
- [ ] Share copies caption to clipboard, then opens share sheet
- [ ] Video mode stays disabled (SOON)
- [ ] Offline banner appears when network drops
- [ ] Rate-limit / network errors show friendly toasts

## Instrumentation

Client events (`src/lib/analytics.ts`):

- `generation_success` / `generation_fail`
- `enhance_prompt`
- `pay_conversion` (hook from payment success screens when wiring checkout UI)
- `share_generation`
- `template_remix`

Swap `setAnalyticsSink` for Segment/Amplitude when ready.
