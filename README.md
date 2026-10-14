# Likha Creatives — Multimedia Studio Website

A modern, responsive, single-page marketing website for **Likha Creatives**, a multimedia studio. Built with plain **HTML, CSS, and vanilla JavaScript** — no build step or dependencies required.

## Files

| File | Purpose |
|------|---------|
| `index.html` | All page content & structure |
| `styles.css` | Styling, color theme, responsive layout |
| `script.js` | Mobile nav, scroll reveal, portfolio filter, contact form, footer year |

## How to view

Open `index.html` directly in a browser, **or** serve it locally:

```bash
# Option A: just double-click index.html

# Option B: local server (recommended)
npx serve .
# or
python -m http.server 8000
```

## Sections

1. **Hero** — headline, tagline, service pills, animated orbit graphic
2. **Services** — Video & Photo Editing, Graphic Design, Digital Art, Logo Design
3. **Portfolio** — filterable gallery (All / Video / Photo / Graphic / Digital Art / Logos)
4. **Packages** — 6 bundle packages with pricing
5. **Standalone Services** — à la carte pricing incl. Mascot & Video Editing sub-tiers
6. **Terms & Conditions**
7. **Contact** — quote request form + info

## Color palette

Deep navy background with royal-blue / violet gradient accents (matching the brand sheet):

- Background: `#060917` → `#0a0f26`
- Card gradient: `#4c5fd6` → `#8b5cf6`
- Accents: indigo `#5b6ee8`, cyan `#22d3ee`, gold `#f5c451`
- Text: `#f2f5ff`, muted `#a8b0d0`

All colors are defined as CSS variables at the top of `styles.css` (`:root`) — tweak them there to rebrand instantly.

## Customizing

- **Portfolio images:** In `index.html`, each `.thumb` uses a gradient + emoji placeholder. Replace the inner `<span>`s with `<img src="your-work.jpg" alt="...">` to show real work.
- **Contact info:** Replace the placeholder email `hello@likhacreatives.com` (appears in the contact section, the footer) with your real address.
- **Contact form ([EmailJS](https://www.emailjs.com)):** Submissions are delivered to your inbox through EmailJS — free tier (200 emails/month), no backend. One-time setup:
  1. Create a free account at [emailjs.com](https://www.emailjs.com).
  2. *Email Services* → add your mail account (e.g. Gmail) → copy the **Service ID**.
  3. *Email Templates* → create a template using the variables below → copy the **Template ID**. Set its **Subject** to `{{subject}}` and **Reply-To** to `{{email}}`.
  4. *Account* → copy your **Public Key**.
  5. Paste all three into the `data-emailjs-public-key`, `data-emailjs-service` and `data-emailjs-template` attributes of `<form id="contactForm">` in `index.html` — the only place they live. (Values still starting with `YOUR_` are treated as "not connected", and the form will say so instead of sending.)

  Template variables: `subject`, `name`, `email`, `phone`, `deadline`, `project_type`, `selection`, `qty`, `estimate`, `refs`, `message`, `reply_to`, `page_url`, `submitted_at`. Recommended extras: add your site's domain to the dashboard *Allow list* and enable reCAPTCHA (*Account → Security*) against spam, and add an *Auto-Reply* template so clients get an instant confirmation.
- **Social links:** Add your Facebook/Instagram URLs in the footer and contact "Reach us" block.
