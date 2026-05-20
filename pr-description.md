## Tailwind CSS Complete UI Rebuild

Complete UI rebuild replacing all hand-written CSS with Tailwind CSS v4 utility classes and semantic component classes.

### What changed
- **Tailwind CSS v4** build pipeline with CSS-first config (no tailwind.config.js)
- **Responsive navigation** with hamburger menu on mobile, horizontal on desktop
- **Calculator forms** rebuilt with grid layout and semantic component classes
- **Mobile tab system** (Calculator / Results / About) — desktop shows all panels side-by-side
- **Native range input** replacing jQuery UI slider dependency
- **15 semantic component classes** extracted for maintainability (`calc-card`, `calc-field`, `tab-btn`, etc.)
- **Demo links** in About tab auto-switch to Calculator tab

### Removed
- jQuery UI (slider replaced with native `<input type="range">`)
- All hand-written CSS (replaced by Tailwind utilities + component classes)

### Preserved
- All calculator functionality and element IDs
- Existing colour scheme
- jQuery (still used by calculator JS)

### Testing
- All 3 calculators functional (offset, fitment, equivalents)
- Mobile tab switching works including auto-switch to Results on Calculate
- Demo links in About tab switch to Calculator tab
- Docker tested on port 8080
