# AdZen.co — Website

A single-page, production-ready marketing site for AdZen.co: an AI-powered growth
partner offering strategic consulting, digital marketing & lead generation, and
custom AI automation systems.

**Latest update:** added Threads and Facebook alongside Instagram (Contact
section, footer, and structured data); portfolio tiles now read "High
Demand" instead of "Coming Soon" since these are services you already
deliver; refreshed the Strategic Business Consulting and Digital
Marketing & Lead Generation tag lists per your notes — see section 1 and
section 6 below for details.

Built as static HTML/CSS/JS (no framework, no build step) so it can be previewed
instantly and deployed to literally any static host.

---

## 1. What's included

- **`index.html`** — the full site: header/nav, hero, services, portfolio
  (placeholder — see below), about, contact + newsletter forms, footer.
  All CSS and JS are embedded in this one file by design, so it's portable
  and easy to preview.
- **`privacy.html` / `terms.html`** — starter legal pages. **These are
  templates, not legal advice** — have a lawyer review them before launch,
  especially since you serve clients in the EU, India, and the US.
- **`supabase/schema.sql`** — database schema + security rules for the
  contact form and newsletter signup.
- **`robots.txt` / `sitemap.xml`** — basic SEO plumbing.
- **`.env.example`** — reference for the two config values the forms need.
- **`assets/`** — your logo (background removed, both light & dark
  variants), a generated favicon set, and a generated social-share (OG)
  image.

### Not included yet (on purpose)

- **Real portfolio visuals.** The four category tiles (Brand & Identity,
  Content & Video, Paid Social & Performance, AI Systems & Automation)
  are tagged "High Demand" since these are services you already deliver
  for clients — only the actual case study images/reels are still
  pending. Send those over whenever you're ready and I'll build out the
  real gallery (with filtering and a lightbox) around them.
- **A live backend.** The contact/newsletter forms are fully coded and
  ready — they just need your own Supabase project connected (10 minutes,
  steps below). Right now, submitting a form will show a success message
  in the console/UI but won't be saved anywhere until you connect it.
- **CAPTCHA / IP-based rate limiting.** The forms have honeypot spam
  trapping built in (see Security notes below), which stops most bots.
  If you want a second layer later, see "Future enhancements."

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
      Search-and-replace is easiest once you know it.
- [ ] **Connect Supabase** (see section 4 below) so form submissions
      actually save.
- [ ] **Send portfolio assets** so that section can go live.
- [ ] **Have a lawyer review** `privacy.html` and `terms.html`.
- [ ] **Swap the OG image / favicon** if you'd like a different look —
      they're auto-generated from your logo in `assets/og/` and
      `assets/favicon/`.
- [ ] **Double-check the phone numbers/email** in the Contact section and
      footer display exactly as you want (currently plain text, not
      hyperlinked, per your brief).

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
your own pitch deck, which uses the same alternation.

---

## 6. Adding real portfolio items later

When you're ready, the cleanest path is to send me the assets (images,
video links, case study copy) and I'll build the gallery + lightbox
directly around them — filtering, autoplay-muted video, lazy loading,
and all. If you'd rather do it yourself first, the four placeholder
tiles in the `.portfolio__grid` are the insertion point — each is just
an `<a>` card; swap the icon/text for a thumbnail and category.

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
- Form fields have associated `<label>`s, inline error text, and a
  `role="status" aria-live="polite"` region for success/error messages.
- All animations respect `prefers-reduced-motion`.
- Color pairs verified against WCAG formulas (see design system note
  above) rather than eyeballed.

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

---

## 10. Performance

- Zero JS/CSS frameworks — no bundle to ship beyond the fonts and the
  Supabase client library (loaded with `defer`).
- Logo is inlined as base64 (small, so it saves a network request); any
  future portfolio images should instead be separate files with
  `loading="lazy"` and modern formats (WebP/AVIF).
- Fonts use `font-display: swap` with `preconnect` hints.
- Reveal-on-scroll animations use `IntersectionObserver`, not scroll
  listeners, to avoid jank.

---

## 11. Deployment

Any static host works. Two common options:

**Netlify**
1. Drag the `adzen-website` folder into [app.netlify.com/drop](https://app.netlify.com/drop), or connect a Git repo.
2. Set your custom domain in Site settings → Domain management.

**Vercel**
```bash
npm i -g vercel
cd adzen-website
vercel --prod
```

Either way, once you have a real domain, don't forget the checklist in
section 3.

---

## 12. Future enhancements (not built yet, easy to add on request)

- CAPTCHA (Cloudflare Turnstile is free and unobtrusive) for a second
  spam-prevention layer beyond the honeypot.
- A small serverless function in front of Supabase for IP-based rate
  limiting (the current setup relies on the honeypot + a unique
  constraint on newsletter emails).
- Splitting into multi-page routing for deeper per-service SEO.
- Portfolio gallery + lightbox once real assets arrive.
