# financefluency.co.uk — feature inventory (research note, crawled 2026-08-25)

**Positioning:** "The Complete Interview Prep Hub" / "Every IB technical, from first principles." UK IB
interview prep for university students (spring weeks, summer analyst, graduate, HireVue-heavy).
Stack (per their privacy policy): Supabase, Stripe, OpenAI (marking + transcription). Email/password
auth only. Dark mode, ⌘K search. No blog/FAQ/community/CV review/human coaching.

Rule: we copy **features and structure**, never text. Repo is public.

## Site map
| Nav | URL | Purpose |
|---|---|---|
| Curriculum | `/learn` | 9 topics / 39 lessons (+ DCF workshop) |
| Practice | `/practice`, `/practice/drill`, `/practice/mock` | Written bank by topic × difficulty; 5-Q AI drill; 15-Q timed mock |
| Flashcards | `/flashcards` | 6 SRS decks (Accounting 21, EV 18, Valuation 19, DCF 24, M&A 20, LBO 19) |
| Interviews | `/interviews`, `/interviews/firms/[slug]`, `/interviews/report` | Topic drills, full mock, 14 firm banks (194 Qs), crowdsourced "report a question" |
| Pulse | `/learn/markets/pulse`, `/pulse/[ticker]`, `/pulse/compare`, `/pulse/practice`, `/pulse/calendar` | Live market data with interview framing |
| Non-Target | `/non-target` | Playbook (7 sections, interactive checklist) |
| Pricing | `/pricing` | Free / Basic £4.99 / Pro £9.99, promo `FIRST100` |

## Curriculum taxonomy (9 topics)
1. Accounting (foundational, **free**) — three statements · linking · working capital · deferred taxes · walk-me-through scenarios
2. EV vs Equity Value (foundational, **free**) — definitions · the bridge · minority interest & associates · traps/edge cases
3. Valuation Methodologies (intermediate) — overview · trading comps · precedents · football field · premiums & control
4. DCF (intermediate) — UFCF · WACC · terminal value · sensitivity · full walk-through · **workshop (build + AI grade)**
5. M&A (advanced) — deal structures · accretion/dilution · synergies · goodwill/PPA · walkthroughs
6. LBO (advanced) — fundamentals · sources & uses · paper LBO · returns maths (IRR/MOIC) · walkthroughs
7. Markets & Why Banking — discussing markets · how to discuss a deal · why IB/why now/why this bank · Pulse
8. Brain Teasers & Mental Math — mental math · probability · classic puzzles
9. Fit & Behavioural — your story · strengths/weaknesses · why this bank · behavioural frameworks

Lessons are 6–12 min. Progress "x / N complete" per module. Locked lessons show title + TOC, body
replaced by upgrade card.

## Lesson page template (the thing to copy most carefully)
1. 2-minute narrated video summary (paid)
2. "Why interviewers open here"
3. Concept, framed around the interview
4. **"The trap"** callout (misconception)
5. **"The canonical answer"** (memorisable model answer)
6. Real filings (Apple FY23) with simplified / as-filed toggle
7. Interactive diagram (three-statement flow; EV bridge as visual equation)
8. Interactive scenario selector (depreciation / inventory on credit / raise debt / sell inventory) animating all three statements
9. Active-recall widgets: "Try first", "Say this out loud, then tap to check", "Your turn → reveal model answer"
10. Quick-fire interview Qs (4 pairs) · "The one-liner to memorise" · "What you can now do"
Walkthrough lessons: single-step → multi-step → advanced (70% partial acquisition); IS→CFS→BS order with ↑/↓ arrows and £ impacts; balance check; "What if…" branches.

## Practice
- ~80 written Qs visible logged-out (Accounting = 40); filters: 9 topics × all/easy/medium/hard; ⌘K.
- Topic Drill (Pro): 5 random Qs, AI-marked, ~8 min. Full Mock (Pro): 15 timed Qs, per-question breakdown + focus areas.

## Flashcards
Flip (tap/space) → "Got it" / "Still learning". Mastered = two in a row; a miss resets. "Review" batches due cards. No decks for Markets/Brain teasers/Fit.

## Interviews / firm banks
- 14 firms: GS 15, MS 15, Barclays 24, JPM 13, Citi 14, UBS 13, DB 12, BofA 12, Lazard 12, Evercore 9, PJT 9, PWP 10, Millennium 24, Blackstone 12.
- Firm dossier: type, founded, HQ, headcount, AUM/revenue, divisions, core values, **recruitment process timeline** (e.g. GS: application + tests → HireVue → AC).
- Question categories: Motivation & fit · Behavioural & competency · Commercial awareness · About you · Technical; grouped by division where relevant.
- Per-question tags: Stage (HireVue / Interview / AC) · Programme (Spring / Summer / Graduate) · Frequency (Very common / Common / Occasional) · Recency (Reported 2024–25 …). 1–2 cited sources (IGotAnOffer, WSO, Glassdoor…). Collapsible "What a strong answer covers" — guidance, not scripts.
- Scorecard: Content 0–10 · Delivery /100 · Eye contact %. Video never uploaded; audio → transcription once; eye-contact model on-device.
- `/interviews/report`: login-required crowdsourcing form (firm, programme, stage, division, timing, context, question), hand-reviewed.

## DCF workshop
Excel-like template on Apple; per-cell guidance; AI rubric grading; Pro adds "VP-style defence questions". Inputs saved to account.

## Pulse (free)
Tiles (megacaps, ASML, FX, BTC) refreshed ~4h; per-instrument "30-second take" + 3 talking points + historical anchors; compare-two-instruments with narrative; practice Qs filled with live numbers; banker-framed economic calendar.

## Non-Target playbook (free with account)
The Reality · Networking playbook (cold email/LinkedIn/coffee chat templates) · CV positioning · Alternative routes in · Building your edge · Timeline & checklist (interactive) · Case study.

## Pricing
| | Free | Basic £4.99 | Pro £9.99 |
|---|---|---|---|
| Accounting + EV lessons, flashcards, practice | ✓ | ✓ | ✓ |
| All topics, video summaries, interactive walkthroughs | | ✓ | ✓ |
| Full question bank + flashcards | | ✓ | ✓ (+ SRS mastery, analytics) |
| AI drills / mocks / HireVue video | | ✓ | ✓ detailed feedback, timed 15-Q mock |
| DCF workshop | | AI grader | + defence Qs |
| Firm banks | browse | | practise the set |
| Fit & behavioural AI grading | | | ✓ |
Monthly only, Stripe, no refunds. Copy inconsistencies on site (39 vs 46 lessons; 194 vs 300+ Qs).

## Ranked list of core features to replicate
1. Structured curriculum with the interview-framed lesson template + module progress
2. Topic-tagged, difficulty-tiered question bank with model answers
3. Firm banks with tags, sources, dossier, process timeline, and report-a-question form
4. AI-marked drills (5-Q) and timed mocks (15-Q) with focus-area report
5. HireVue-style video mock with delivery scoring, privacy-first local processing
6. Spaced-repetition flashcards with mastery rule
7. Interactive lesson widgets (three-statement animator, EV bridge, filings toggle, video summaries)
8. Guided DCF workshop with AI grading + defence Qs
9. Freemium gating + pricing
10. Pulse
11. Non-Target playbook
12. Supporting: testimonials/uni strip, "vs just asking AI" section, contact form, dark mode, ⌘K

## Where we beat them (our differentiators)
- **Mentor chatbot** with citations to real mentor material — they explicitly have no human/AI mentor layer ("Couldn't I just ask AI?" is their objection section; our answer is "ask *Tesleem*").
- Mentor-in-the-loop content review; "asked in" provenance from our own students rather than scraped forums.
- Learning path (10-week default) rather than a flat catalogue.
- Excel/model drills across the curriculum, not only a DCF workshop.
