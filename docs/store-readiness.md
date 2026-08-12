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

## RevenueCat (Android + iOS — single purchase path)

Purchases are led entirely by RevenueCat's native SDK on both platforms; there is no
direct Razorpay or manual Apple-receipt integration.

1. Create a RevenueCat project at app.revenuecat.com, with an app entry for iOS and
   one for Android.
2. In App Store Connect and Google Play Console, create auto-renewable subscriptions
   matching:

   | Product ID | Plan | Credits |
   |---|---|---|
   | `damroo_starter_monthly` | Starter | 500 |
   | `damroo_growth_monthly` | Growth | 1000 |
   | `damroo_scale_monthly` | Scale | 2000 |

3. In RevenueCat, attach both stores' products to a single "default" offering with
   three packages (one per plan) so `Purchases.getOfferings()` returns them together.
4. Project settings → API keys → copy the iOS and Android **public** SDK keys into
   `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`.
5. Project settings → Integrations → Webhooks → add endpoint:

   `https://thvqecpkurkzcmkdqzki.supabase.co/functions/v1/revenuecat-webhook`

6. Set the same value in the webhook's "Authorization header" field and in the Edge
   secret `REVENUECAT_WEBHOOK_AUTH_HEADER`.

The client calls `Purchases.configure({ apiKey, appUserID: <supabase user id> })` once
signed in (see `src/services/purchases.ts`), so `revenuecat-webhook` can match
`event.app_user_id` straight back to the Supabase user and credit their account via
`activate_plan_subscription`.

## Cron — expire subscriptions

Schedule a daily POST to:

`https://thvqecpkurkzcmkdqzki.supabase.co/functions/v1/cron-expire-subscriptions`

Header: `x-cron-secret: <CRON_SECRET>`

Zeros credits and marks plans expired after `current_period_end` (no rollover).

## Edge secrets checklist

- `ARK_API_KEY` (+ optional `ARK_BASE_URL`, `ARK_MODEL`)
- `OPENAI_API_KEY`
- `REVENUECAT_WEBHOOK_AUTH_HEADER`
- `CRON_SECRET`

## QA checklist

- [ ] Google sign-in (iOS + Android); Apple sign-in (iOS only)
- [ ] New user blocked from tabs until paid onboarding completes
- [ ] Android: RevenueCat (Play Billing) purchase → 500 / 1000 / 2000 credits; fail → no grant
- [ ] iOS: RevenueCat (StoreKit) purchase → same credits via `revenuecat-webhook`
- [ ] Period end without renew → credits 0 (cron + `EXPIRATION` webhook event)
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
