# Modernisation Plan — rims.xsrt.net

## Branch
Work on `feature/modernise` (from `master`). One commit per logical change. Do not merge to main.

---

## Phase 1: Cleanup (commit per item)

### 1a. Remove unused files
- Delete `test.html` (duplicate of offset page)
- Delete `scripts/jquery/jquery.blockUI.js` (never referenced)

### 1b. Remove Google Analytics
- Remove the `_gaq` / ga.js script block from all 3 tool pages:
  - `tools/offset/index.html`
  - `tools/fitment/index.html`
  - `tools/equivalents/index.html`
- Remove `trackEvent` and `trackAction` functions from `scripts/common.js`
- Remove `trackEvent(...)` calls from form `onsubmit` attributes in tool pages

### 1c. Remove share/dialog dead code
- Remove `<div id="share-dialog">` from all 3 tool pages
- Remove the `calculator.share()` function from `scripts/garagelsd.offset.js`
- Remove `.ui-dialog .ui-dialog-titlebar` CSS from inline `<style>` blocks
- Remove `#share-dialog` rule from `style/style.css`

### 1d. Consolidate CSS — extract used styles from garagelsd-style.css
**Styles to KEEP** (merge into `style/style.css`):
- `body { background: #f1f1f1; }`
- `#content, #content input, #content textarea { color: #444; }`
- `a:link, a:visited, a:active, a:hover { color: #7D6402; }`
- `a:active, a:hover { color: #333333; }`
- `#content { font-size: 10pt; }`
- `#content h1-h6 { margin-bottom: 12px; }`
- `.button` styles (all 3 states: default, hover/focus, active) — lines 199-238

**Everything else is unused WordPress theme CSS — delete the file.**

Also clean vendor prefixes throughout all CSS:
- Remove `-moz-box-shadow`, `-webkit-box-shadow` (use only `box-shadow`)
- Remove `-moz-border-radius`, `-webkit-border-radius` (use only `border-radius`)
- Remove `-moz-linear-gradient`, `-ms-linear-gradient`, `-o-linear-gradient` (use only standard `linear-gradient`)
- Remove `-o-text-overflow`
- Remove `-moz-binding` (Firefox-specific XML binding hack)

---

## Phase 2: Library Updates (commit per item)

### 2a. Replace jquery.scrollTo with native API
In `scripts/garagelsd.offset.js`, replace:
```js
register(this, "scrollTo",
function(selector) { $j.scrollTo($j(selector), 500); });
```
With:
```js
register(this, "scrollTo",
function(selector) { document.querySelector(selector).scrollIntoView({ behavior: 'smooth' }); });
```
Then delete `scripts/jquery/jquery.scrollTo.min.js` and remove its `<script>` tag from all 3 tool pages.

### 2b. Fix jQuery 3 compatibility
In `scripts/common.js`:
- Replace `$j.trim(element.value)` → `element.value.trim()` (in garagelsd.offset.js actually, check both files)

In `scripts/garagelsd.offset.js`:
- `$j.trim(element.value)` → `element.value.trim()`

### 2c. Update jQuery
- Download jQuery 3.7.1 minified → replace `scripts/jquery/jquery-1.8.3.min.js`
  - URL: https://code.jquery.com/jquery-3.7.1.min.js
  - Update all `<script src>` references

### 2d. Update jQuery UI
- Download jQuery UI 1.14.1 minified → replace `scripts/jquery/jquery-ui-1.10.0.custom.min.js`
  - URL: https://code.jquery.com/ui/1.14.1/jquery-ui.min.js
  - Update all `<script src>` references
  - Only the slider widget is used

---

## Phase 3: Eleventy Setup

### 3a. Initialize project
```bash
npm init -y
npm install --save-dev @11ty/eleventy
```
Create `.eleventy.js` config:
- Input: `src/`
- Output: `_site/`
- Passthrough copy: `scripts/`, `style/`, `images/`, `CNAME`, `sitemap.xml`, `google3b2058e7dcf2b777.html`

Add to `.gitignore`: `node_modules/`, `_site/`

### 3b. Create base layout
`src/_includes/base.njk`:
- `<!DOCTYPE html>`, charset, viewport meta
- `<title>{{ title }} | Wheel offset and fitment comparison tools</title>` (or just site title for redirect page)
- Script tags for jQuery, jQuery UI, common.js, garagelsd.offset.js
- CSS links for style.css, offset.css
- Nav bar with active state: `{% if navActive == "offset" %}...{% endif %}`
- `{{ content | safe }}` block for page-specific content

### 3c. Convert tool pages to Nunjucks
Move tool pages to `src/tools/*/index.njk` with front matter:
```yaml
---
layout: base.njk
title: Split Rim Offset Calculator
navActive: offset
---
```
Each page contains ONLY its unique form, results table, description content.

### 3d. Move static assets into src/
- `src/scripts/`, `src/style/`, `src/images/`
- `src/index.html` (redirect page — passthrough)
- `src/CNAME`, `src/sitemap.xml`, `src/google3b2058e7dcf2b777.html`

### 3e. Add build scripts to package.json
```json
{
  "scripts": {
    "build": "eleventy",
    "dev": "eleventy --serve"
  }
}
```

---

## Phase 4: Docker

### 4a. Create Dockerfile
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/_site /usr/share/nginx/html
EXPOSE 80
```

### 4b. Create docker-compose.yml
```yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
```

---

## Phase 5: CI/CD Workflows

### 5a. CI workflow (`.github/workflows/ci.yml`)
Triggers: pull_request to main
Steps:
1. Checkout
2. Setup Node 22
3. npm ci
4. npm run build
5. (Optional) HTML validation on _site output

### 5b. Deploy workflow (`.github/workflows/deploy.yml`)
Triggers: push to main
Steps:
1. Checkout
2. Setup Node 22
3. npm ci
4. npm run build
5. Upload artifact (actions/upload-pages-artifact)
6. Deploy to GitHub Pages (actions/deploy-pages)

Permissions: pages write, id-token write

### 5c. Update CodeQL workflow
- Bump `actions/checkout` to v4
- Bump `github/codeql-action/*` to v3
- Change branch targets from `master` to `main`

---

## Phase 6: Branch Rename

### 6a. Rename master → main
```bash
git branch -m master main
git push origin main
git push origin --delete master
```
Update GitHub default branch setting to `main`.
Update branch protection rules.
Switch GitHub Pages source to "GitHub Actions" (instead of branch-based).

---

## Notes
- The `register()` function in common.js implements method overloading by argument count — this pattern works fine with jQuery 3
- `$j = jQuery.noConflict()` is used throughout — keep it for now
- RIMTUCK.com links use `http://` — update to `https://` if the site supports it (check first)
- The equivalents page has a typo: "whel" → "wheel" (line 81) — fix while editing
