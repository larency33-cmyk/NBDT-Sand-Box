# NBDT Hub v0.6.106 — validation

Base release: v0.6.105. The only intended functional changes are the SSO visual shift and the increased cart appearance rate in the Deliver phase.

## Geometry of the button (browser screenshot preview, same CSS and alignment algorithm, not a production app boot)

Each original gap = rendered SSO top - rendered subtitle bottom at v0.6.105. The v0.6.106 lift is 80% of that gap. The remaining gap is exactly 20% (subpixel tolerance ±0.2 CSS px).

| Viewport | Original gap | New gap | Button-to-cloud clearance after lift |
|---|---:|---:|---:|
| 1759×863 | 50.54px | 10.12px | 70.4px |
| 1280×720 | 50.02px | 10.00px | 70.0px |
| 1440×900 | 74.94px | 14.99px | 89.9px |
| 1920×1080 | 80.54px | 16.11px | 94.4px |
| 950×500 | 9.00px | 1.80px | 49.5px |
| 390×844 | 25.00px | 5.00px | 241.8px |
| 430×932 | 25.00px | 5.00px | 270.1px |
| 768×1024 | 148.26px | 29.65px | 148.6px |

On all 8 screen sizes, NBDT logo position, copy position, SSO width, scene origin and corporate footer remained unchanged compared to v0.6.105; no overlap with the subtitle. Browser preview uses static DOM but actual project CSS and algorithm.

## Delivery motion

- Original `.nb99-cart` retains the 20,000ms cycle.
- Additional `.nb106-extra-cart` uses a 200,000ms supercycle, with 3 bonus trips starting at 13.4s, 73.4s, and 133.4s. These are after regular trips in their respective 20-second cycles.
- 10 original + 3 bonus = 13 total appearances per 200 seconds, exactly 30% increase in average cart appearance rate, not 30% speed-up of a single pass.
- Browser computed animation durations and visibility/translation sampled at 0/13.8/15.6/17.5/40/73.8/133.8/200 seconds confirm extra passes, return to hidden state and preservation of original cart timing.
- Shared clock still pauses all animations together when user pauses the scene, background tab is hidden or reduced-motion is enabled. No new JS timer created for bonus trips.

## Tests

- `node --test tests/signin-v101.test.mjs ... tests/signin-v106.test.mjs`: **18 passed / 18**.
- `npm run check:syntax`: **passed**.
- `node scripts/check-symbols.cjs`: **passed (14 TSX files)**.
- `npm test`: **580 passed / 23 failed / 603 total**. Exactly 23 legacy assertions also failed in v0.6.105 (577/23/600); all 3 new v106 tests pass.
- Vite production build **not verified** (Vite executable not installed in this environment). Full browser integration with real SSO was not tested. Nothing about auth or other product pages was changed.
