# Kilnkeep — Product Brief

## One-line
A fast, mobile-first glaze-testing notebook for potters who actively develop and dial in
glazes: log test tiles, link *what you changed* to *what came out of the kiln*, and get one
AI nudge on what to try next.

## Demand reality (read this before building)
- **Demand to USE — real and active.** 15+ pottery-tracking apps have launched or persisted
  through 2024–2026, plus paper "kiln notebooks" that sell well. People clearly want this.
- **Demand to PAY — modest.** Mostly free or one-time ~$10; no evidence anyone is getting rich.
  Treat this as a "make a little money" project, not a breakout.
- **Implication:** do NOT build "general pottery tracker #18." The only viable path is a sharp
  wedge plus a way to reach a specific community. This brief commits to one wedge.

## The wedge
Most apps optimize for *piece tracking* (where's my mug, what stage). Glazy owns the *recipe
database* but is clunky for your own iterative testing. Almost no one nails the **glaze-testing
loop**: I made a test tile → these were the variables → it fired → here's the result → what's
the single next change? Kilnkeep owns that loop, with variable diffing (`parent_test_id`
lineage) and the one AI feature: diagnose a result + suggest one change.

## Target user
Potters actively developing or dialing in glazes — serious hobbyists, studio members running
tests, small functional-ware sellers chasing repeatability. NOT absolute beginners, NOT people
who only want piece-tracking (already well served).

## Non-goals
- No community feed. No attempt to out-database Glazy. No subscription. ONE AI feature.
- No studio-management/billing (Kiln Fire owns that).

## Monetization
- Free: up to ~10 test tiles. One-time unlock $9.99 (unlimited + AI + charts + blend helper +
  export). AI top-up ~$1.99 / 100 suggestions. Tip jar.
- Framing: "Buy once. Your data is yours. Export anytime. No subscription." — a direct answer
  to subscription fatigue + lock-in fear in this market.

## Distribution — the part that actually decides success
Decide BEFORE building: where do the first 50 users come from? r/Pottery, r/ceramics, a studio
bulletin board, a specific group, a YouTube potter who tests glazes. No channel = the build
won't matter.

## Stack
React + Vite + TS · Supabase (auth/db/storage, RLS) · Vercel · Anthropic for the single AI
feature. Mobile-first PWA, offline-friendly logging (studios have poor wifi — table stakes).
