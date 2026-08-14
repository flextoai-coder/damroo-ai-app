# Damroo AI — Agent Brief

## What we are building

**Damroo AI** — a cross-platform Expo (React Native) app for AI image generation (GPT-wrapper style). Users sign in, onboard with business details + paid plan, then generate images via ByteDance Seedream 4.5, browse history, remix templates, and share with captions.

Target: Google Play + App Store. Stack: Expo SDK 57, Supabase (auth/DB/storage/Edge Functions), Seedream 4.5, OpenAI (prompt enhance + captions), RevenueCat (Android + iOS subscriptions).

Video module is UI-only for now (“Coming soon”, unclickable). Image module only.

---

## Expo constraint (hard)

Expo has changed. Before writing any Expo APIs, read the versioned docs:

https://docs.expo.dev/versions/v57.0.0/

Do not use outdated Expo patterns or APIs from memory.

---

## Product surface

| Flow | Requirement |
|------|-------------|
| Auth | Single login/signup screen. Google + Apple (Apple **iOS only**) + email/password. Supabase Auth. Signup returns to login for manual sign-in. |
| Onboarding (new users) | Business name, website, industry → subscription (Starter / Growth / Scale) → pay → then tabs. |
| Tabs | Home · Templates · Brand Kit · Profile (AI Assistant via center FAB) |
| Module selector | Top-right: Image \| Video. Video disabled. |
| Home | Previous generations in 2-col Pinterest-style grid (async/cached). Tap → detail (full image, prompt, caption, share). |
| AI Assistant | Chat generate/iterate. Controls: ordered image attachments, aspect ratio, quality (2K/4K), image count, templates, enhance prompt. Credits chip top-right. Conversation remembers prior generations for edits. |
| Templates | Owner-provided, filter by industry. Preview + Remix → Assistant prefilled. |
| Profile | Personal + onboarding fields, plan, status, credits. |
| Share | On share tap: copy caption to clipboard first, then native share sheet. |
| Loading | Distinct animation while an image is generating. |

---

## Credits & plans (locked)

- **1 credit = ₹1** · **no rollover**
- Starter ₹999 → 999 credits · Growth ₹4,999 → 4,999 credits · Scale ₹9,999 → 9,999 credits (monthly)
- Credit cost per generation varies by model + quality tier, not a flat 1 credit/image:
  - Seedream 4.5 — 2K: 20 credits · 4K: 50 credits
  - GPT Image 2 — 2K (`medium`): 25 credits · 4K (`high`): 60 credits
  - Multiplied by `image_count` for multi-image batches. See `creditsPerImage` in `src/constants/playground.ts` (client) and `supabase/functions/_shared/credit-cost.ts` (server, authoritative) — keep both in sync.
- Debit **as generation starts** (row created + marked `processing`, before the provider call runs); refund on provider failure (idempotent)
- Period end without renew → credits go to **0**

---

## Non-negotiables

1. **Never put secrets in the client** — `ARK_API_KEY`, `OPENAI_API_KEY`, the RevenueCat webhook auth secret live only in Supabase Edge Function secrets / server env. App uses `EXPO_PUBLIC_SUPABASE_*` + anon key + RevenueCat's *public* SDK keys only.
2. **All AI mutations go through Edge Functions** with a valid Supabase JWT. Purchases go through RevenueCat's native SDK on-device; credits are only ever granted server-side by the `revenuecat-webhook` Edge Function, never by the client.
3. **Credits are authoritative on the server** — atomic debit (`FOR UPDATE`), ledger audit, never trust client credit counts.
4. **Persist Seedream outputs to Supabase Storage immediately** — provider URLs expire (~24h).
5. **Apple Sign-In only on iOS.** Purchases are led entirely by RevenueCat on both Android and iOS — no direct Razorpay or manual Apple-receipt calls.
6. **Onboarding incomplete → no tabs.** Paid plan required before main app (v1).
7. **Attachment order is sacred** — pass reference images to Seedream in the same order the user attached them.
8. **Video stays disabled** until explicitly scoped later.
9. **Match existing project layout** — Expo Router under `src/app/`, alias `@/*` → `src/*`. Don’t invent a parallel app tree.
10. **Follow Expo SDK 57 docs** for any Expo API usage.

---

## Architecture constraints

```
App (UI) → Supabase Auth / DB / Storage (RLS)
         → Edge Functions → Seedream | OpenAI
         → RevenueCat SDK (Android + iOS) → RevenueCat webhook → Edge Function → credits
```

- **Client cache:** Zustand (UI/session) + TanStack Query (server state) + FlashList + `expo-image`. Not Redis on device.
- **RLS on all user tables.** Service role only inside Edge Functions.
- **Seedream model:** `doubao-seedream-4-5-251128` via Volcengine Ark (`/api/v3/images/generations`).
- **Enhance prompt / captions:** OpenAI, server-side only.

---

## Build order (do not skip ahead)

1. Foundation — deps, env, providers, folders  
2. Supabase schema + RLS + storage  
3. Auth + route gate  
4. Onboarding + RevenueCat (Android + iOS)  
5. Tabs shell + module selector + credits chip  
6. Edge AI — enhance-prompt, generate-image, generate-caption  
7. AI Assistant UI + loading animation + conversation memory  
8. Home grid + generation detail + caption/share  
9. Templates + Profile  
10. EAS + store products/webhooks + QA — see `docs/store-readiness.md`  

---

## Out of scope (v1)

Video generation · credit rollover/top-ups · admin CMS · Redis · team accounts.

---

## Coding rules for agents

- Prefer small, focused changes that match this brief and the build order.
- Do not add features from “out of scope.”
- Do not weaken RLS, credit checks, or secret handling for convenience.
- When unsure about Expo APIs, check SDK 57 docs first — do not guess.
