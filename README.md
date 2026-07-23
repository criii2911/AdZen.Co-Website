# AdZen.co — Website

A single-page, production-ready marketing site for AdZen.co: an AI-powered growth
partner offering strategic consulting, digital marketing & lead generation, and
custom AI automation systems.

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
  and `assets/portfolio/` with your 8 real creatives (optimized to WebP,
  thumbnail + full-size pairs, originals were ~2MB each — now 30–250KB).

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
| Display font | Archivo (800/900) | Headlines |
| Body font | Hanken Grotesk | Paragraphs, nav, forms |
| Utility font | IBM Plex Mono | Eyebrows, tags, stat labels |

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

---

## 6. Adding more portfolio items later

The gallery at `#portfolio` is a real CSS-columns masonry (`.work-masonry`
→ `.work-item` buttons), so it already handles mixed aspect ratios without
cropping. To add a new piece:

1. Drop the image at `assets/portfolio/your-slug.webp` (a thumb + full
   pair, same pattern as the existing 8 — thumb ~760px wide for the grid,
   full ~1400px wide for the lightbox keeps things fast).
2. Copy one `<button class="work-item">` block, update `data-full`,
   `data-tag`, `data-title`, the `<img>` `src`/`width`/`height`/`alt`, and
   the two spans inside `.work-item__overlay`.
3. That's it — the lightbox JS reads every `.work-item` on the page
   automatically, so a new button is wired up with no other changes.

Send me new creatives any time and I'll do this for you directly.

---

## 7. SEO

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

## 8. Accessibility (WCAG 2.2 AA)

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

---

## 9. Security

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

## 10. Performance

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

---

## 11. Deployment

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

## 12. Future enhancements (not built yet, easy to add on request)

- CAPTCHA (Cloudflare Turnstile is free and unobtrusive) for a second
  spam-prevention layer beyond the honeypot.
- A small serverless function in front of Supabase for IP-based rate
  limiting (the current setup relies on the honeypot + a unique
  constraint on newsletter emails).
- Splitting into multi-page routing for deeper per-service SEO.
- Portfolio gallery + lightbox once real assets arrive.
