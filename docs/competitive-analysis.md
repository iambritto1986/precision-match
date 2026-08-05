# Competitive Analysis — Enhancv, AIApply, JobAssist

**Prepared for:** Britto, August 2026
**Purpose:** Understand what the market offers, identify gaps worth closing, and find positioning we can defensibly own.

> All figures are vendor self-reported unless noted, and pricing changes frequently — treat specific numbers as directional, not contractual. Sources are listed at the end.

---

## 1. The three companies are not the same business

The most useful finding: these three compete in *adjacent* markets, not the same one. Lumping them together would lead us to build the wrong things.

| | **Enhancv** | **AIApply** | **JobAssist** |
|---|---|---|---|
| **Core promise** | Build a resume good enough for both ATS and a human | Apply to many jobs fast, with AI doing the work | Automate the search so you don't burn out |
| **Centre of gravity** | The document | The application volume | The pipeline |
| **Maturity** | 11 years, 10M+ users, 5,309 reviews at 4.5 | ~2M users claimed, fast-growing | New entrant (2026 press coverage) |
| **Business model** | Subscription | Subscription + consumable credits | Subscription |
| **Where we overlap** | **Heavily** — this is our direct competitor | Partially — resume/cover letter/interview | Barely — we don't do search or auto-apply |

**Enhancv is our real competitor.** AIApply and JobAssist are mostly playing a volume-and-automation game we have not entered and may not want to.

Note on AIApply's numbers: the homepage states "2,064,348 users" in one place and "1,166,440" in another. Self-reported and internally inconsistent — discount accordingly.

---

## 2. Feature matrix

✅ have · 🟡 partial · ❌ missing

| Capability | Enhancv | AIApply | JobAssist | **Precision Match** |
|---|:--:|:--:|:--:|:--:|
| **Document creation** |
| AI resume builder | ✅ | ✅ | 🟡 | ✅ |
| Template variety | ✅ 15+ | ✅ | ❌ | ✅ 8 |
| ATS-safe PDF with text layer | ✅ | ✅ | — | ✅ |
| DOCX export | ❌ (PDF/TXT only) | ✅ | — | ✅ |
| A4 / Letter page formats | — | — | — | ✅ |
| Cover letter generator | ✅ | ✅ | 🟡 | ✅ |
| Matching resume + letter designs | ✅ | 🟡 | ❌ | ❌ |
| **Intelligence** |
| Tailor to job description | ✅ one-click | ✅ | ✅ | ✅ |
| Per-change accept / reject | ✅ | ❌ | ❌ | ❌ |
| Inline AI chat inside document | ✅ | ❌ | ❌ | ❌ |
| ATS / match score | ✅ 27 checks | ✅ scanner | 🟡 feedback | ✅ |
| Fixes shown on the resume itself | ✅ | ❌ | ❌ | ❌ |
| Grammar / readability as you type | ✅ | ❌ | ❌ | ❌ |
| Skills finder | ✅ | ❌ | ❌ | ❌ |
| Translation | ✅ 30+ langs | ✅ 50+ langs | ❌ | ❌ |
| Multi-language UI | ✅ 14 | ✅ 13 | ❌ | ❌ |
| **Interview** |
| Question / STAR prep | ✅ | ✅ | ❌ | 🟡 |
| Mock interview | ✅ text | ✅ | ❌ | ✅ **voice** |
| Live in-interview assistance | ❌ | ✅ | ❌ | ❌ *(deliberately)* |
| Company research | ✅ | ❌ | ❌ | ❌ |
| **Pipeline** |
| Job board / search | ✅ 1M+ ads | ✅ | ✅ 7M+ | ❌ |
| Application tracker | ✅ | 🟡 | ✅ | ❌ |
| Auto-apply | ❌ | ✅ | ✅ | ❌ |
| Chrome extension | ✅ | ❌ | ❌ | ❌ |
| **Account** |
| LinkedIn import | ✅ | ✅ | ✅ | 🟡 endpoint exists |
| Document storage | ✅ 300 | ✅ | — | 🟡 3 free / 10 Pro |
| Persistent career profile | 🟡 | 🟡 | ✅ | 🟡 designed, not built |

---

## 3. Where we are genuinely behind

Ranked by (value to user) ÷ (effort on our stack).

### Tier 1 — high value, low effort

**1. Job application tracker.** Every competitor has one; we have nothing. It's CRUD over Firestore with a status field, notes, and a link to the tailored resume we already store. No AI cost, no new infrastructure. It's also the feature that creates *retention*: a resume builder is used once, a tracker is opened daily. This is the single biggest strategic gap.

**2. Per-change accept / reject on tailoring.** Enhancv's most-praised interaction: changes are highlighted but **not applied automatically**, and you approve them individually or all at once. Ours rewrites the resume wholesale. This matters doubly for us because our differentiator is honesty — showing the user exactly what changed *is* the honesty feature made visible. Medium frontend effort, no backend change.

**3. Resume storage limit.** Enhancv gives 300 documents. We give 3 free / 10 Pro. Ours will feel punitive to anyone applying seriously. Raise the Pro cap once the Firestore document-size question in the profile design doc is resolved.

**4. Fixes shown on the resume itself.** We return an ATS score and keyword lists in a side panel. Enhancv puts each gap *on the resume* at the line it applies to. Same data we already compute, better presentation.

### Tier 2 — high value, moderate effort

**5. Persistent career profile.** JobAssist's whole model is "upload once, we handle the rest." Already specced in `candidate-profile-design.md`, Phase 1 shipped. Finish it.

**6. Inline AI chat in the document.** Enhancv calls this their key differentiator versus builders that "send you to a separate interface." Our AI lives in a left panel. Reworking to inline editing is a significant frontend change but transforms the product feel.

**7. Translation.** 30–50 languages elsewhere, zero for us. Gemini does this well and it's largely a prompt plus a language picker. High perceived value, low technical risk.

### Tier 3 — expensive, and strategically questionable

**8. Job board / search.** Requires an ads aggregation pipeline or a paid feed. Real cost, real ongoing maintenance.

**9. Auto-apply.** AIApply and JobAssist both do it. Before copying it, see §5 — I think this is a trap for us.

---

## 4. Where we can win

### 4a. Voice interview practice is genuinely differentiated

Enhancv's interview help generates *questions and written STAR answers*. AIApply does mock interviews. **Neither offers a real-time spoken conversation.** Aadhya on Gemini Live does. That's a hard-to-copy capability we already shipped, and it's the most emotionally valuable part of a job search — people are far more anxious about speaking than about formatting.

We are currently under-selling this. It's one nav item with a gold accent. It could be the headline of the entire product.

### 4b. Honest tailoring — but this is contested ground, not open ground

Worth being clear-eyed: **Enhancv makes the same claim we do.** Their copy says "grounded in your real experience, never invented," "no AI hallucinations or invented facts," and — strikingly close to what we implemented — "when a line needs a number the tool can't know, it drops in a placeholder instead of inventing the figure."

So honesty is table stakes at the top of this market, not a moat. What we can still own is *demonstrating* it: show the user every change, cite which line of their source material each claim came from, and refuse loudly when a job description asks for a skill they lack. Enhancv asserts grounding; we could make it visible and verifiable.

### 4c. The ethical gap AIApply leaves wide open

AIApply sells **Interview Buddy**: live AI coaching *during* a real interview, fed "through your earpiece or screen," with a keyboard shortcut to generate an answer while the interviewer is speaking.

That is helping people deceive an employer in real time. It's a legitimate product decision for them and clearly sells — but it creates a positioning opening for a competitor who explicitly refuses to do it. "We'll help you prepare; we won't help you cheat" is a real brand, and it's consistent with the grounding work already in our prompts.

This is also a genuine business risk *for them*: as employers catch on, tools associated with live interview assistance may get named and blocked.

### 4d. Under-served: the person applying for someone else

We built `subject: 'self' | 'other'` for correctness. None of the three appears to handle this at all. Career coaches, recruiters, and family members building resumes for others are a real segment — Enhancv sells to career coaches as a separate org plan. Our identity model is quietly a foundation for that.

---

## 5. On auto-apply: my recommendation is don't

It's the loudest feature in the market and I think it's wrong for us.

- **It's commoditised and price-driven.** AIApply, JobAssist, LazyApply, Sonara, LoopCV all do it. Competing means competing on volume and price.
- **It contradicts our entire positioning.** We just spent significant effort making the AI refuse to overstate the candidate. Mass-applying to hundreds of roles is the volume play, and quality tailoring is the opposite bet. Doing both makes us incoherent.
- **It's operationally brutal.** Auto-apply means maintaining scrapers against thousands of hostile, constantly-changing ATS forms. That's a permanent engineering tax on a solo founder.
- **The value to the user is contested.** Employers increasingly filter out mass applications; "ghost jobs" and volume-spam are actively discussed problems — Enhancv publishes research on exactly this.

**Better adjacent bet:** a Chrome extension that captures a job ad from any site into the tracker and tailors a resume for it in one click. Most of the convenience, none of the deception, far less maintenance.

---

## 6. Design and UX worth borrowing

1. **Diff-style review of AI changes** — highlight proposed edits, accept/reject individually or in bulk. The single best pattern in this market.
2. **AI that works where you're looking** — inline in the document, not a separate panel.
3. **Score with fixes attached** — never a bare number; every gap carries the specific action.
4. **Placeholders, never invented figures** — we already do this in prompts; surface it visibly in the UI as a filled-in `[add number]` chip the user must resolve.
5. **Match score on every job card** — instant triage.
6. **Import an existing tracker** from Sheets/Excel in under a minute — removes the switching cost from whatever spreadsheet they're using today.
7. **Onboarding that skips the blank page** — resume upload or LinkedIn URL as the first-run default.
8. **Original research as marketing.** Enhancv's Research Lab publishes studies on ghost jobs, AI hiring, RTO. This drives 1M+ monthly blog readers and enormous SEO. Cheap to start, compounds for years, and works particularly well for a founder with a genuine point of view.

---

## 7. Pricing and packaging

| | Free tier | Paid |
|---|---|---|
| **Enhancv** | 7 days, branded exports, max 12 section items | ~$19.99/mo; ~$13.33/mo quarterly; page advertises "from $16.50" |
| **AIApply** | Limited free tier, no time limit | Premium subscription + **auto-apply credits sold in packs** (100 / 250) |
| **JobAssist** | Not clearly published | Subscription incl. applications, matching, feedback, reports |
| **Precision Match** | 3 AI credits + 1 download, no expiry | Pro |

**Observations:**

- **Enhancv's free tier is a trial, not a free product** — after 7 days you cannot download at all. Ours never expires. That's a real acquisition advantage we don't advertise.
- **Our free tier is generous in duration, stingy in volume.** One download total is harsh: a user who exports, spots a typo, fixes it and re-exports has already hit the wall. Consider 1 download *per resume* or 3 total. The current rule risks a bad first impression at the exact moment of highest satisfaction.
- **The hybrid model is worth stealing.** AIApply separates subscription (tools) from credits (expensive actions). We already have credits. Voice interview minutes are our genuinely expensive action — that's a natural consumable on top of a flat Pro tier, rather than bundling it and eating variable cost.
- **Anchor price.** Competitors sit at $13–20/month. If we target India as well as the US, consider regional pricing; a flat $19 is very different money in Chennai than in Chicago.

---

## 8. Recommended sequence

**Now (weeks):**
1. Job application tracker — biggest retention gap, lowest effort
2. Accept/reject diff UI for tailoring — makes our honesty visible
3. Fix the free-download limit — likely costing conversions today
4. Raise Pro resume cap

**Next (months):**
5. Finish the candidate profile (Phase 2–3 of the existing design doc)
6. Lead with voice interview practice in positioning and landing page
7. Resume translation
8. Chrome extension: capture job → tracker → tailor

**Later / evaluate:**
9. Inline AI editing (large frontend rework)
10. Job matching feed
11. Original research content programme

**Recommend against:** auto-apply, live in-interview assistance.

---

## 9. Honest limitations of this analysis

- Everything here comes from public marketing pages and third-party reviews. I have not used any of these products, so claimed features may work less well than advertised.
- Pricing was inconsistent across sources even within a single vendor's own pages; verify before making decisions.
- JobAssist has the thinnest public information and two similarly-named domains (`jobassist.io`, `jobassist.com`) that may be different companies — confirm which one you meant before acting on that column.
- User counts, interview-rate claims ("61% get an interview in 10 days") and hiring outcomes are vendor marketing and are not independently verified.
