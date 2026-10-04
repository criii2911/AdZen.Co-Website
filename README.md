# AdZen.co — Website

## v12 — Portfolio case studies, new hero scene, interface pass

**Portfolio** is now five case studies (WARI, Product Storytelling, Zohebo, Level 1, Social Reels): sticky project index + media filter, large feature stage, staggered columns, sticky metadata panel, cursor "View/Play" label, pointer tilt + sheen, lightbox with counter. All 22 original assets and the lightbox/filter behaviour are kept. Case copy lives in `index.html` (`.case__brief`, `.case__facts`). **Add real results** (e.g. a "Result" row) inside `.case__facts` when you have client-approved numbers — none were invented.

**Hero 3D** (`assets/js/hero-forge.js`, raw WebGL, ~5.7KB gz, no Three.js): a tower of glass plates that assemble, turn and part on scroll. Runs on mobile at lower pixel ratio / capped fps. CSS plate stack is the first paint and the fallback for reduced-motion, no-WebGL, Save-Data and JS-off. The old line/wireframe hero (SVG + Three.js `hero-3d.js`) is deleted.

**Removed:** the General Inquiries number (contact block and footer). The New Business / WhatsApp number remains.

**Interface:** new full-screen mobile menu, refined nav, buttons (magnetic on desktop), eyebrow and heading typography; decorative ring/glow layers removed. `assets/js/ux.js` holds the portfolio/cursor/magnetic behaviour.

**SEO/GEO:** added `ItemList` schema for the portfolio; case studies are deep-linkable (`#case-wari` etc.).
**Still required before launch:** replace `yourdomain.com` in the canonical, Open Graph, JSON-LD, `robots.txt` and `sitemap.xml` with your real domain.

## Latest update — Scroll & motion system

Additive pass: content, brand, structure, forms and Supabase are unchanged.

**New files:** `assets/js/motion.js` (the engine), `assets/js/lenis.min.js` (Lenis 1.3.26, MIT, self-hosted, ~5KB gz, license in `LENIS-LICENSE.txt`). `hero-3d.js` got two small hooks (progress from the engine, suspend when covered).

**What it does**
- Smooth scroll on mouse/trackpad devices only; touch keeps native scrolling. Pauses while the lightbox, modal or mobile menu is open.
- Pinned hero "curtain": the hero recedes (scale/blur/depth) while stats + sections slide over it as rounded sheets.
- Scrubbed (reversible) 3D tilt-and-rise on service cards and all 22 portfolio tiles; portfolio columns drift at different rates.
- Process rail pins on desktop and fills step by step (01-05 counter); stacks normally on mobile.
- Word-by-word headline reveals, batch-staggered reveals, depth layers, top progress line, hero intro.

**Performance rules:** one rAF loop that sleeps when idle; layout measured only on load/resize; only transform/opacity/translate animated; blur only on the hero exit on fine-pointer desktops; `will-change` only near the viewport; no cursor-driven effects.

**Fallbacks:** `prefers-reduced-motion` = static page, nothing pinned/scrubbed. If `motion.js` fails to load, a failsafe removes the `.js` gate so everything is visible.

**Tuning:** amplitudes live in `motion.js` (`render()`); sheet radius is `--sheet-r`; rail length is `.process-rail[data-pin]{height:165vh}`. Hover effects use the CSS `translate` property so they never fight the engine's `transform`.

**Tested (headless Chromium):** no horizontal overflow and no script errors at 360, 390, 768, 820, 1024, 1280, 1440, 1920 widths; reduced motion; script-failure fallback; anchor nav, lightbox scroll-lock, back-to-top. **Not tested:** real devices, real frame rates/Core Web Vitals (run Lighthouse after deploy), and the Three.js hero (CDN blocked in my sandbox).

**CSP:** `_headers` already allows same-origin scripts, so no change needed.

---
A single-page, production-ready marketing site for AdZen.co: an AI-powered growth
partner offering strategic consulting, digital marketing & lead generation, and
custom AI automation systems.

## Latest update — Apple-inspired glass material pass

A material-language refinement, applied with the restraint the brief
itself asked for: glass where there's real depth to blur, not as a
blanket effect. Every placement decision below has a reason, including
the places I deliberately didn't touch.

**Buttons — the biggest change, per the brief's own priority.** The
primary lime CTA stays a solid fill on purpose: its whole job (from a
much earlier pass) is to be "impossible to miss," and translucency
would work against that. Instead it gained a soft diagonal light-sweep
that crosses the surface on hover — the "premium light response" the
brief asked for, without diluting the button's visual weight. The
secondary/outline buttons changed more: they used to flip to a solid
fill on hover (an older, blunter pattern), and now stay genuine
translucent glass — backdrop-blur, thin border, brightening slightly on
hover instead of inverting. Verified cream text stays comfortably
readable (11–14:1) against the new glass background in both places it's
actually used.

**Floating UI — success modal and lightbox — converted to real glass.**
These sit on top of blurred, dimmed page content, so there's genuine
depth behind them to blur — unlike a card sitting on a flat color, this
is where backdrop-blur actually does something. Verified text contrast
holds (13.3:1, 5.2:1) even at the worst-case background color behind the
modal.

**Nav on scroll, refined — and a real pre-existing bug found while
verifying it.** Deepened the existing scroll-triggered glass (more blur,
a soft inner top highlight). While checking contrast on the more
translucent version, found that the *original* header — before any of
today's changes — was already failing WCAG for its default nav-link
color once scrolled over a light section (3.4:1, need 4.5:1). This
wasn't something I introduced; nobody had caught it before. Fixed by
brightening the nav-link color specifically in the scrolled/glass state,
without touching the shared muted-text token used everywhere else on
the site.

**Deliberately left alone:**
- **Service cards.** They sit on a flat solid cream background — backdrop-
  blur there would have zero visible effect (blurring a flat color
  produces the same flat color), which is exactly the "glassmorphism
  applied without a reason" the brief warns against. They were already
  close to the brief's own ideal anyway: subtle border, no shadow at
  rest, soft radius.
- **Mobile nav drawer.** It's a full-viewport overlay that only ever
  renders on the exact devices where blur is most expensive — skipped
  backdrop-blur there entirely rather than add the single priciest
  possible blur usage on the least capable hardware.
- **Blur-to-sharp scroll reveals.** Considered it — the existing reveal
  system touches 30+ elements including the 22-item portfolio grid, and
  animating `filter:blur()` at that scale is real repaint cost for a
  subtle gain, working against the GPU-only discipline from the
  previous animation-audit pass. Opacity + translateY stayed as-is.

**Mobile blur reduction (explicit requirement).** Backdrop-blur is real
GPU cost on lower-end phones. Rather than hand-tune five separate
components, the two blur tokens (`--glass-blur`, `--glass-blur-sm`) get
redefined once inside the existing mobile breakpoint — every glass
surface (header, modals, buttons, filter pills) scales down together.

## V7 → V8 polish pass — what changed

A version-upgrade pass, not a redesign: audited against the site's own
existing standards and fixed genuine gaps, left alone what already held
up. Every item below has a concrete before/after, not a vibe.

**Real accessibility/SEO fix — heading hierarchy.** Several sections
skipped levels: the About section's value cards and process steps jumped
straight from the section's `h2` to `h4` with no `h3` in between; the
footer's column labels jumped from the last `h2` all the way to `h5`; the
Newsletter section (a sibling of Contact, Services, Portfolio, About — not
nested inside any of them) used `h3` where every other top-level section
uses `h2`. Screen readers navigating by heading level would hit real gaps
here. Fixed all of it — verified zero visual change, since every one of
these had an explicit `font-size` already overriding the tag's browser
default.

**Design-system gap — error states weren't tokenized.** `#ff6b6b` and
`#ff9b9b` were hardcoded in 3 places for form-error styling, outside the
`:root` token system everything else draws from. Added `--error` and
`--error-soft`. Verified both already pass WCAG comfortably (9.8:1 and
8.1:1) before touching anything — this was a maintainability fix, not a
contrast fix.

**Real inconsistency — the newsletter form was a half-step behind the
contact form.** Same site, two forms, different polish level: the
newsletter input's focus state was missing the background-color
reinforcement (and the transition itself) the contact form's inputs have;
the newsletter submit button never showed "Subscribing…" the way the
contact form shows "Sending…", so clicking it gave no feedback beyond a
slight dim; and its Supabase-not-configured fallback still said "Backend
not yet connected — see README" out loud, a dev-facing message I'd
already cleaned out of the contact form's equivalent path in an earlier
pass but never mirrored here. All three now match.

**Real performance fix — unused font weights.** Checked every single
`font-weight` declaration against what was actually being requested from
Google Fonts. Archivo was pulling 500/700/800/900 but every heading and
display-text rule in this file explicitly sets 700 or 800 — never 500,
never 900. Hanken Grotesk pulled 500 too, unused, with body text's real
default (400) already loaded separately, so nothing could even be
falling back to it. Cut both — 10 font-weight files down to 7, zero
visual change, verified by exhaustive grep before touching the request
URL. Left IBM Plex Mono's two weights alone: several of its labels don't
set an explicit weight, so removing either risked a real, if subtle,
fallback-matching shift I couldn't fully verify without a browser.

**Minor SEO trim.** Meta description was 167 characters, over the ~160
where Google starts truncating snippets — trimmed to 147, same meaning.
The `<title>` looked over-length in the raw HTML (its `&amp;` entity
counts as 5 characters in source) but decodes to 58 characters in an
actual browser tab or search result, which is exactly on target — left
alone rather than "fixed" a problem that only existed in how I was
counting it, not in what a reader would ever actually see.

**Checked and already solid, so deliberately left alone:** the spacing
scale (component-level padding that doesn't map to `--sp-*` is normal,
not a violation — forcing it would be over-engineering, not polish);
button disabled states (`pointer-events:none` already makes an explicit
`cursor:not-allowed` a no-op, so its absence isn't a bug); responsive
behavior at narrow/wide extremes (zero fixed-width `width:` declarations
found anywhere — everything already uses `max-width`, which is why
nothing was breaking at 320px or stretching oddly at 1920px); the
existing animation/hover-gating work from the previous pass (verified
still intact, not re-touched).

## Animation & interaction audit — what changed

Applied [Emil Kowalski's animation/design skill set](https://github.com/emilkowalski/skills)
as a real audit against this codebase — not a redesign, a systematic
review against a precise standard (duration budgets by interaction
frequency, easing-curve rules, hover/focus discipline). Every finding
below has a file:line basis; nothing was changed on vibes.

**Found and fixed:**
- **A real bug**, not just a style nit: the 22-item portfolio masonry had
  *two* competing scroll-reveal systems running on the same elements at
  once — a leftover `data-reveal-stagger` on the grid container from
  before individual per-item reveals were added, still sitting there
  alongside `data-reveal` on all 22 items. Removed the redundant one.
- **A hardcoded 600ms hover transition** on portfolio image zoom — the
  single worst offender found, on the most-hovered element on the page.
- **420ms used for hover-frequency interactions.** Service cards and
  portfolio items were animating on hover with the same duration this
  file uses for modals (420ms — correct for something seen once per
  session; too slow for something hovered dozens of times browsing a
  grid). Added a new `--dur-hover: 240ms` token, scoped to exactly that
  class of interaction, and left modals/drawers/the sticky header alone
  (420ms is right for those).
- **Stagger delays at 100ms/step** where 30–80ms reads as "orchestrated";
  100ms+ reads as "slow." Tightened to 0/50/100/150ms.
- **Hover effects with no touch guard.** `:hover` on a touchscreen
  triggers on tap and can visually stick until the next tap elsewhere —
  buttons, service cards, and portfolio items now gate their hover
  transforms behind `@media (hover:hover) and (pointer:fine)`. Keyboard
  focus (`:focus-visible`) was deliberately kept separate and *never*
  gated — accessibility can't depend on pointer type, so those rules
  were split out, not wrapped, everywhere they'd been combined with
  `:hover` in the same selector.

**Checked and already correct, so left alone:** easing curves (the
existing `--ease` token is already a proper custom strong ease-out, not
a lazy `ease`/`ease-in-out` default), zero `ease-in` usage anywhere,
zero `scale(0)` entrances, typography tracking already varies correctly
by size (negative on large display text, positive on small mono labels),
button `:active` press feedback was already in the right range. A
number-count-up animation for the stats strip was considered and
deliberately skipped — two of the four stats ("AI+", "Hours") aren't
numbers, so animating only half the set would read as inconsistent
rather than premium.

## V2 update — what changed

**Fixed (real bugs, found by reading the live code):**
- Removed a duplicated `<!DOCTYPE>/<html>/<head>` block and duplicated
  `<meta charset>`/`<meta viewport>`/`<title>` tags — invalid HTML that had
  been introduced when Google Analytics was added. Your GA snippet
  (`G-VJ3WYK5H0W`) and Supabase config are untouched and still wired up
  exactly as before.
- Your own Screaming Frog export (`issues_overview_report.csv`) flagged
  3 security-header issues (missing X-Frame-Options, CSP, HSTS) — these
  can only be set as real HTTP response headers, not `<meta>` tags, so
  a `_headers` file has been added for Cloudflare Pages, which reads it
  automatically with zero extra config.
- The same report flagged "Canonicalised"/"Non-Indexable Canonical" on
  all 3 pages, at High priority. Root cause: the canonical/OG/JSON-LD
  tags still say `https://www.yourdomain.com` — once this is live at a
  real domain, search engines see every page's canonical pointing to a
  domain that isn't the one they're crawling. **This needs your real
  domain to fix properly** — send it over and it's a 2-minute find/replace
  across `index.html`, `privacy.html`, `terms.html`, `robots.txt`, and
  `sitemap.xml`. I didn't want to guess a domain and make the same
  problem worse in a different way.

**Redesigned:**
- Real portfolio section (masonry gallery + lightbox) using your 8
  uploaded creatives — see section 1 and 6 below.
- Stronger CTAs, hero typography, service-card hierarchy, footer, nav
  (scroll-spy active state + scroll-shrink animation), and a new stats
  strip + 5-step process rail for trust — all using AdZen's own real
  numbers from the pitch deck, not invented ones.
- Contact form now confirms success with an animated modal instead of
  inline text; removed office hours and country/"borderless" mentions;
  Threads and Facebook removed from social links (Instagram kept, since
  it's the one verified working link — see section 5 below).

**Assumptions made — please double-check:**
- Phone numbers are now labeled "New Business · WhatsApp" (9220353377)
  and "General Inquiries" (7011341631), based on which number appears
  throughout your pitch deck as the primary contact. If that's backwards,
  it's a one-line swap in `index.html` (search "New Business").
- I only kept Instagram as a real social link/icon. The brief mentioned
  LinkedIn/X/Behance/Dribbble/GitHub as options "if applicable" — I don't
  have real URLs for AdZen on any of those, and the brief was explicit
  that every social icon must actually work with no placeholders. Send
  real links and they're a quick add.
- No client testimonials, client logos, or before/after content were
  added — I don't have real ones, and inventing quotes or logos would
  misrepresent the business. The stats strip and process steps use only
  numbers already published in your own pitch deck.

Built as static HTML/CSS/JS (no framework, no build step) so it can be previewed
instantly and deployed to literally any static host.

---

## 1. What's included

- **`index.html`** — the full site: header/nav, hero, stats strip, services,
  portfolio (real gallery), about (with process rail), contact + newsletter
  forms, footer. All CSS and JS are embedded in this one file by design,
  so it's portable and easy to preview.
- **`_headers`** — Cloudflare Pages reads this automatically at deploy time
  to add security response headers (see section 9).
- **`privacy.html` / `terms.html`** — starter legal pages. **These are
  templates, not legal advice** — have a lawyer review them before launch,
  especially since you serve clients in the EU, India, and the US.
- **`supabase/schema.sql`** — database schema + security rules for the
  contact form and newsletter signup. Your live Supabase project is
  already connected in `index.html` — no setup needed unless you want to
  point it at a different project.
- **`robots.txt` / `sitemap.xml`** — basic SEO plumbing.
- **`.env.example`** — reference for the two config values the forms need.
- **`assets/`** — your logo (background removed, both light & dark
  variants), a generated favicon set, a generated social-share (OG) image,
  and `assets/portfolio/` with 22 real pieces across five categories
  (Product Storytelling, Zohebo Apparel, WARI Wellness Awareness, Level 1
  Gaming Cafe, and AdZen's own video reels) — all optimized to WebP
  (thumbnail + full-size pairs) and `assets/portfolio/video/` with the 6
  reels re-encoded as compact H.264/AAC MP4s. Every original was
  compressed hard for the web: the 16 images went from ~2MB PNGs each
  down to 30–250KB; the 6 videos went from a combined ~111MB down to
  ~8.4MB, none of which loads until someone actually clicks to watch.

### Known gaps (not fabricated on purpose)

- **The domain placeholder.** `yourdomain.com` still appears in canonical/
  OG/JSON-LD tags — see the note above. This is actively causing the
  "Canonicalised" issue in your Screaming Frog report right now.
- **CAPTCHA / IP-based rate limiting.** The forms have honeypot spam
  trapping built in (see Security notes below), which stops most bots.
  If you want a second layer later, see "Future enhancements."
- **Testimonials, client logos, before/after.** Not added — no real ones
  to use yet.

---

## 2. Preview it right now

No installation needed — just open `index.html` in a browser. Or, for a
more realistic local preview (recommended, since some browsers restrict
`fetch` calls from `file://` URLs):

```bash
cd adzen-website
npx serve .
# or: python3 -m http.server 8000
```

---

## 3. Before you launch — checklist

- [ ] **Replace the placeholder domain.** Every instance of
      `https://www.yourdomain.com` (in `index.html`, `privacy.html`,
      `terms.html`, `robots.txt`, `sitemap.xml`) needs your real domain.
      This is currently causing the High-priority "Canonicalised" issue
      in your Screaming Frog report — send the real domain and it's a
      2-minute fix.
- [x] ~~Connect Supabase~~ — already connected and live (see section 4).
- [x] ~~Send portfolio assets~~ — 8 real creatives are live in the gallery.
- [ ] **Have a lawyer review** `privacy.html` and `terms.html`.
- [ ] **Confirm the phone number labels** — "New Business · WhatsApp" for
      9220353377 and "General Inquiries" for 7011341631 is an assumption
      based on your pitch deck; flip it if that's backwards.
- [ ] **Re-crawl with Screaming Frog after deploying** to confirm the
      `_headers` file resolved the 3 security-header warnings (Cloudflare
      Pages only applies `_headers` on its own deployments, not in local
      preview).
- [ ] **Swap the OG image / favicon** if you'd like a different look —
      they're auto-generated from your logo in `assets/og/` and
      `assets/favicon/`.

---

## 4. Set up the backend (Supabase — ~10 minutes)

The newsletter and contact forms use [Supabase](https://supabase.com), a
managed Postgres database with a generous free tier. This was chosen
because it gives you a secure, scalable store **and** a built-in
dashboard to view/export submissions — no custom admin panel needed.

1. Create a free account at supabase.com and click **New Project**.
2. Once it's ready, open the **SQL Editor** and paste in the entire
   contents of `supabase/schema.sql`, then click **Run**. This creates
   two tables (`contact_submissions`, `newsletter_subscribers`) with
   security rules already applied.
3. Go to **Settings → API**. Copy the **Project URL** and the
   **`anon` `public`** key (NOT the `service_role` key).
4. Open `index.html`, find this block near the top of the `<script>` tag:
   ```js
   var SUPABASE_URL = 'YOUR_SUPABASE_URL';
   var SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   and paste in your real values.
5. Reload the page — forms will now write to your database.

**To view submissions:** Supabase dashboard → Table Editor → select the
table. You can filter, search, and export to CSV directly from there —
this covers the "admin dashboard" and "CSV export" requirements without
needing a custom-built internal tool.

**Is it safe to put the anon key in frontend code?** Yes — this is the
standard, intended pattern. The anon key is public by design; the real
security boundary is the Row Level Security policy in `schema.sql`,
which only allows **inserting** new rows, never reading, updating, or
deleting existing ones. Your `service_role` key (which *would* be
dangerous to expose) is never used here.

---

## 5. Design system reference

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0A0A0A` | Primary dark background / text on light |
| `--cream` | `#F5F3EF` | Primary light background |
| `--blue` | `#2563FF` | Trust/action — buttons, large headline accents |
| `--lime` | `#B8FF00` | CTA highlight — used sparingly, always with dark text on top |
| `--navy` | `#1A1F2E` | Secondary dark surface (solid header, portfolio) |
| `--error` / `--error-soft` | `#ff6b6b` / `#ff9b9b` | Form validation only — border / message text |
| `--glass-bg` / `--glass-bg-hover` | `rgba(245,243,239,.06)` / `.1` | Translucent fill for glass surfaces |
| `--glass-border` / `--glass-highlight` | `rgba(245,243,239,.16)` / `.4` | Glass edge / hover-state edge |
| `--glass-blur` / `--glass-blur-sm` | `20px` / `12px` | Backdrop-blur radius — redefined to `10px`/`6px` under the mobile breakpoint, so every glass surface scales down together |
| Display font | Archivo (700/800) | Headlines |
| Body font | Hanken Grotesk (400/600/700) | Paragraphs, nav, forms |
| Utility font | IBM Plex Mono (500/600) | Eyebrows, tags, stat labels |

**Where glass is used, and where it deliberately isn't:** the scrolled
header, the success modal, the lightbox and its controls, the secondary/
outline buttons, and the portfolio filter pills all use the glass tokens
above — each of those sits over something with real visual depth behind
it (the hero's aurora, dimmed/blurred page content, the portfolio's dot-
grid texture), which is what makes backdrop-blur actually do something.
Service cards and the mobile nav drawer intentionally don't — see
"Latest update" above for why. If you add a new glass surface, ask first
whether there's real content behind it worth blurring; if it's sitting on
a flat solid color, the blur token won't do anything visible and skipping
it is the right call, not an oversight.
**A contrast note:** `--blue` on `--cream` and `--blue` on `--navy` both
land just under the 4.5:1 ratio required for small body text under WCAG
2.2 AA. Blue is therefore only used as large/bold text (headlines,
36px+) or as a solid button fill (with white text on top, which passes
comfortably) — never as small link or paragraph text. Small links use
the surrounding text color with an underline, shifting to blue/lime only
on hover and focus.

Section backgrounds alternate dark → light → dark → light → dark (hero,
services, portfolio, about, contact) — a deliberate rhythm borrowed from
your own pitch deck, which uses the same alternation. The new stats strip
sits directly under the hero in the same ink tone on purpose (with just a
thin divider line) so it reads as an extension of the hero — a "credibility
bar" — rather than a new section breaking the rhythm.

**Two duration tokens, two different jobs — don't mix them up:**
- `--dur-hover` (240ms) — anything hovered repeatedly while browsing:
  cards, portfolio items, icons. Stays snappy on purpose.
- `--dur` (420ms) — anything seen once per session: the sticky header's
  scroll transition, modals, the mobile drawer. Slower reads as more
  deliberate for a state change you only trigger occasionally, not
  sluggish for something you hover forty times a minute.

If you add a new hover effect: use `--dur-hover`, and wrap the `:hover`
rule in `@media (hover:hover) and (pointer:fine){ }` so it doesn't stick
on a touch tap (see `.service-card`, `.work-item`, or `.btn` for the
pattern). If that same element also has a `:focus-visible` style, keep it
as a **separate, ungated** rule — never combine it into the same
selector as `:hover`, or keyboard users on a touch device lose their
focus indicator.

---

## 6. Premium visual layer (hero)

A purely additive enhancement layer behind the hero content — nothing
about the existing layout, spacing, typography, colors, buttons, or other
animations changed to build this. Two effects remain, both scoped to
`#home` and both fully autonomous (nothing here reacts to the cursor —
the mouse-follow light and mouse-based parallax that were originally
part of this were removed on request; see the changelog above):

- **Aurora background** — three large, heavily-blurred (`blur(70–90px)`)
  gradient shapes using only existing palette colors (`--blue`, `--cream`,
  a very faint `--lime`), each drifting on its own slow, non-synchronized
  CSS loop (37s / 46s / 58s) via `transform`. Never above ~16% opacity at
  its gradient's own center, fading to fully transparent — this is meant
  to be felt, not seen directly.
- **Animated grain** — a single small (160×160) `<canvas>`, CSS-stretched
  to fill the hero, repainted with fresh random noise roughly 15 times a
  second (not every frame — grain doesn't need 60fps to look right, and
  this keeps the redraw cost negligible). `mix-blend-mode: overlay` at
  2.5% opacity, so it never shifts overall brightness.

**Performance:**
- The grain redraw lives in one `requestAnimationFrame` loop, fully
  cancelled (not just idled) on `document.visibilitychange` when the tab
  isn't visible, and never started at all on mobile widths or under
  `prefers-reduced-motion`.
- The aurora's own drift is pure CSS `animation` on `transform` only
  (never `filter` or `background-position`), so it's compositor-friendly
  and already automatically neutralized by this file's existing site-wide
  reduced-motion rule.
- No new libraries, no new network requests, no new `<script>` tag — all
  of this is added code inside the one inline `<script>` block that was
  already there.

**Responsiveness:**
- **Desktop/Tablet** (≥768px): aurora + grain both run. Aurora's drift
  range is reduced at tablet widths (768–1023px) via a `--drift-range`
  CSS custom property override.
- **Mobile** (<768px): aurora only. This is enforced twice — once in JS
  (the grain loop never starts below 768px) and once in plain CSS
  (`.hero-grain { display:none; }` at that breakpoint), so it holds even
  if JS fails to load for any reason.

**Accessibility:** every element here is `aria-hidden="true"` and
`pointer-events:none` — none of it is reachable by keyboard or screen
readers, and none of it can intercept a click meant for the existing CTAs
or nav. Opacity values are low enough that they don't measurably change
contrast behind the hero text (which sits in its own stacking layer above
all of this via the hero content's pre-existing `z-index:1` — a value
that already existed and wasn't touched to make any of this work).

---

## 7. Adding more portfolio items later

The gallery at `#portfolio` is a real CSS-columns masonry (`.work-masonry`
→ `.work-item` buttons) with a filter bar above it, so it already handles
mixed aspect ratios and both media types without cropping. To add a new
piece:

**Image:**
1. Drop the image at `assets/portfolio/your-slug.webp` (a thumb + full
   pair, same pattern as the existing 16 — thumb ~760px wide for the grid,
   full ~1400px wide for the lightbox keeps things fast).
2. Copy one `<button class="work-item" data-media-type="image">` block,
   update `data-full`, `data-tag`, `data-title`, the `<img>`
   `src`/`width`/`height`/`alt`, and the two spans inside
   `.work-item__overlay`.

**Video:**
1. Re-encode to web-friendly H.264/AAC MP4 first — don't upload a raw
   phone/export file as-is (see the video note in section 10). A rough
   ffmpeg recipe that matches what's already in `assets/portfolio/video/`:
   ```bash
   ffmpeg -i your-source.mov -vf "scale=720:-2,fps=30" \
     -c:v libx264 -preset faster -crf 27 -pix_fmt yuv420p \
     -c:a aac -b:a 128k -movflags +faststart \
     assets/portfolio/video/your-slug.mp4
   ```
2. Extract a poster frame and save it as `assets/portfolio/your-slug-poster.webp`
   (~760px wide, same as the other posters) — pick a timestamp partway
   into the clip, not frame 0, which is often a fade-in/black frame.
3. Copy one `<button class="work-item work-item--video" data-media-type="video">`
   block, update `data-video-src`, `data-tag`, `data-title`, the poster
   `<img>`, and the duration badge text.

Either way — the filter bar's item counts ("All Work (22)", "Photos &
Graphics (16)", "Videos (6)") are just static text in the `<h2>`-adjacent
filter buttons, so bump those numbers by hand when you add items. The
lightbox and filter JS both read `.work-item` elements directly, so a new
button is wired up automatically with no other code changes.

Send me new creatives any time and I'll do this for you directly.

---

## 8. SEO

- Semantic HTML5 (`header`, `main`, `section`, `footer`), one `<h1>` per
  page, logical heading order.
- Meta title/description, canonical tag, Open Graph + Twitter Card tags,
  JSON-LD `Organization` structured data.
- `robots.txt` + `sitemap.xml` included.
- Because this is a single page with anchor sections (matching the flow
  described in your brief), the sitemap only lists one primary URL. If
  you'd like each service or portfolio piece to rank on its own later,
  splitting into separate pages (e.g. `/services`, `/portfolio`) is a
  natural next step and I'm happy to do that restructure.

---

## 9. Accessibility (WCAG 2.2 AA)

- Skip-to-content link, visible focus states (lime/blue outline) on all
  interactive elements.
- Keyboard-operable mobile menu (Escape to close, focus returns
  correctly).
- Portfolio lightbox and success modal are both real dialogs: focus moves
  in on open, is trapped inside (Tab/Shift+Tab cycle, don't leak to the
  page behind), Escape closes, and focus returns to the exact element
  that opened it.
- Form fields have associated `<label>`s, inline error text, and a
  `role="status" aria-live="polite"` region for validation messages.
- All animations respect `prefers-reduced-motion`, including the new
  hero parallax and success-modal checkmark draw-in.
- Color pairs verified against WCAG formulas (see design system note
  above) rather than eyeballed — including a small-text contrast bug
  (blue-on-cream at 11px, 4.4:1 vs. the 4.5:1 required) caught and fixed
  during this update, in the new process-step numbers.
- The portfolio filter bar uses real `<button>`s with `aria-pressed`
  (not just color) to indicate the active filter, and lives in a
  `role="group"` with a label. Video playback uses the browser's native
  `<video controls>` UI rather than custom controls, so it's keyboard-
  and screen-reader-operable for free; autoplay is muted-only (required
  for reliable autoplay across browsers) with visible controls to unmute.

---

## 10. Security

- Client-side validation on both forms, mirrored by database-level
  `CHECK` constraints in `schema.sql` (length limits, email shape).
- Row Level Security restricts the public API key to `INSERT` only —
  no read/update/delete access to anyone without your project
  credentials.
- Honeypot field on both forms (`website` — a hidden input real users
  never see or fill in; if it's filled, the submission is silently
  discarded client-side).
- No secrets in the codebase — only the Supabase anon key, which is
  meant to be public (see section 4).
- Submit buttons disable during submission to prevent duplicate posts.
- `_headers` file adds X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy, HSTS, and a Content-Security-Policy
  — picked up automatically on Cloudflare Pages (see section 11). The CSP
  allows `'unsafe-inline'` for script/style because this site is
  intentionally a single self-contained HTML file; tightening that
  further would mean splitting out CSS/JS into external files first.

---

## 11. Performance

- Zero JS/CSS frameworks — no bundle to ship beyond the fonts and the
  Supabase client library (loaded with `defer`).
- Logo is inlined as base64 (small, so it saves a network request).
- Portfolio images are pre-optimized WebP, thumb + full pairs
  (originals were ~2MB PNGs each; thumbs are now 30–130KB, full lightbox
  versions 70–250KB), with `loading="lazy" decoding="async"` and explicit
  `width`/`height` to prevent layout shift.
- Fonts use `font-display: swap` with `preconnect` hints.
- Reveal-on-scroll animations use `IntersectionObserver`, not scroll
  listeners; the hero parallax uses a `requestAnimationFrame`-throttled
  scroll listener to avoid jank.
- **Video never loads until requested.** There is exactly one `<video>`
  element on the whole page, inside the lightbox, and it starts with no
  `src` at all. The grid only ever shows a WebP poster image per video
  (same weight class as any other thumbnail) — the actual MP4 is only
  fetched, via JS, the moment someone clicks that specific video, and its
  `src` is cleared again on close so nothing keeps buffering or playing
  in the background. This is why 6 videos could be added without touching
  initial page weight at all.

---

## 12. Deployment

This repo is ready to push to GitHub and deploy on Cloudflare Pages with
zero extra configuration — no build command, no output directory setting
needed (it's a static root, so leave the build command blank).

**Cloudflare Pages**
1. Push this repo to GitHub.
2. In the Cloudflare dashboard: Workers & Pages → Create → Pages → connect
   the repo.
3. Build settings: leave "Build command" empty, set "Build output
   directory" to `/`.
4. Deploy. The `_headers` file is picked up automatically — no extra step.
5. Add your custom domain under Custom domains, then complete the
   domain-placeholder checklist item in section 3.

**Netlify** (alternative)
1. Drag the `adzen-website` folder into [app.netlify.com/drop](https://app.netlify.com/drop), or connect a Git repo.
2. Set your custom domain in Site settings → Domain management.
3. Note: Netlify uses its own `_headers` file format, which happens to
   match Cloudflare's — the same file works on both.

**Vercel** (alternative)
```bash
npm i -g vercel
cd adzen-website
vercel --prod
```
Note: Vercel does not read Cloudflare-style `_headers` files — the
security headers would need to move into a `vercel.json` `headers` block
if you deploy there instead.

Whichever host you use, once you have a real domain, don't forget the
checklist in section 3.

---

## 13. Future enhancements (not built yet, easy to add on request)

- CAPTCHA (Cloudflare Turnstile is free and unobtrusive) for a second
  spam-prevention layer beyond the honeypot.
- A small serverless function in front of Supabase for IP-based rate
  limiting (the current setup relies on the honeypot + a unique
  constraint on newsletter emails).
- Splitting into multi-page routing for deeper per-service SEO.
- Portfolio gallery + lightbox once real assets arrive.
