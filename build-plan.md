# Build Plan: Seller Photo Verification Prototype

## 1. Scope

Single-page React app. No backend. No models. All scores hardcoded.

Purpose: demonstrate what the system would do, not do it. The "technical_scalability_image_correlation.md" file would be put on the "View Technical Report" button, as it carries the engineering feasibility and justification.

Deliverable: one `.jsx` file, self-contained, Tailwind for styling.

## 2. Screen map

```
+----------------+--------------------------------------------------+
|                |  Seller photo check          [View Technical Report]
|  Products (30) |--------------------------------------------------|
|                |                                                  |
|  > Cotton Kurti|                     [ Run check ]                 |
|    Steel Bottle|                                                  |
|    Neckband    |   Display Picture          Seller's Photo        |
|    Silk Saree  |   +--------------+         +--------------+       |
|    Dosa Tawa   |   |              |         |              |       |
|    ...         |   |  placeholder |         |  placeholder |       |
|                |   |              |         |              |       |
|                |   +--------------+         +--------------+       |
|                |                            Sharpness  312         |
|                |                                                  |
|                |   ------------------ results ------------------   |
|                |   Verdict banner                                  |
|                |   Planarity 0.14 | Screen artifact 0.22 | Match 0.81
|                |   Cascade trace                                   |
+----------------+--------------------------------------------------+
```

Empty state, right pane: "Please choose an image pair."

## 3. State

Three pieces only.

| State        | Type           | Purpose                     |
| ------------ | -------------- | --------------------------- |
| `selectedId` | string or null | Which product is loaded     |
| `hasRun`     | boolean        | Whether results are visible |
| `reportOpen` | boolean        | Technical report modal      |

Rules:

- Selecting a product sets `selectedId` and resets `hasRun` to false.
- Selecting the same product again does nothing.
- Results only render when `selectedId && hasRun`.

No async. No loading state. Optionally add a 400ms fake delay on Run so the interaction reads as computation. Recommended: yes, with a disabled button and "Checking..." label. It makes the demo legible without pretending to be real.

## 4. Data model

One array, 30 entries. Verdict is not stored. It is derived by the cascade function at run time, so the rule logic is visible in code rather than baked into the data. This is the single most important structural decision in the prototype.

```js
const PAIRS = [
  {
    id: "p01",
    name: "Cotton Kurti, Set of 2",
    sharpness: 312,
    planarity: 0.14,
    artifact: 0.22,
    match: 0.81,
  },
  {
    id: "p02",
    name: "Steel Water Bottle, 1L",
    sharpness: 268,
    planarity: 0.19,
    artifact: 0.17,
    match: 0.76,
  },
  {
    id: "p03",
    name: "Bluetooth Neckband",
    sharpness: 244,
    planarity: 0.87,
    artifact: 0.92,
    match: 0.96,
  },
  {
    id: "p04",
    name: "Kanjivaram Silk Saree",
    sharpness: 401,
    planarity: 0.28,
    artifact: 0.31,
    match: 0.73,
  },
  {
    id: "p05",
    name: "Non-stick Dosa Tawa, 30cm",
    sharpness: 38,
    planarity: 0.22,
    artifact: 0.19,
    match: 0.61,
  },
  {
    id: "p06",
    name: "Men's Running Shoes, Size 9",
    sharpness: 289,
    planarity: 0.11,
    artifact: 0.24,
    match: 0.31,
  },
  {
    id: "p07",
    name: "Wall Clock, Wooden Frame",
    sharpness: 355,
    planarity: 0.79,
    artifact: 0.27,
    match: 0.84,
  },
  {
    id: "p08",
    name: "Ceramic Mug Set, 4pc",
    sharpness: 197,
    planarity: 0.16,
    artifact: 0.2,
    match: 0.78,
  },
  {
    id: "p09",
    name: "Laptop Sleeve, 15.6in",
    sharpness: 331,
    planarity: 0.91,
    artifact: 0.89,
    match: 0.94,
  },
  {
    id: "p10",
    name: "Wireless Mouse",
    sharpness: 213,
    planarity: 0.24,
    artifact: 0.18,
    match: 0.42,
  },
  {
    id: "p11",
    name: "Handloom Bedsheet, Double",
    sharpness: 176,
    planarity: 0.58,
    artifact: 0.29,
    match: 0.69,
  },
  {
    id: "p12",
    name: "Storage Containers, 6pc",
    sharpness: 51,
    planarity: 0.31,
    artifact: 0.26,
    match: 0.58,
  },
  {
    id: "p13",
    name: "Yoga Mat, 6mm",
    sharpness: 229,
    planarity: 0.44,
    artifact: 0.23,
    match: 0.71,
  },
  {
    id: "p14",
    name: "Tempered Glass, 6.1in",
    sharpness: 188,
    planarity: 0.94,
    artifact: 0.96,
    match: 0.98,
  },
  {
    id: "p15",
    name: "Brass Diya Set, 12pc",
    sharpness: 372,
    planarity: 0.09,
    artifact: 0.15,
    match: 0.8,
  },
  {
    id: "p16",
    name: "Cotton Bath Towel",
    sharpness: 241,
    planarity: 0.33,
    artifact: 0.21,
    match: 0.47,
  },
  {
    id: "p17",
    name: "Bamboo Cutting Board",
    sharpness: 298,
    planarity: 0.62,
    artifact: 0.34,
    match: 0.77,
  },
  {
    id: "p18",
    name: "LED Table Lamp",
    sharpness: 22,
    planarity: 0.18,
    artifact: 0.25,
    match: 0.66,
  },
  {
    id: "p19",
    name: "Leather Wallet, Men's",
    sharpness: 254,
    planarity: 0.21,
    artifact: 0.16,
    match: 0.85,
  },
  {
    id: "p20",
    name: "Sports Water Jug, 2L",
    sharpness: 317,
    planarity: 0.13,
    artifact: 0.22,
    match: 0.19,
  },
  {
    id: "p21",
    name: "Printed Wall Poster, A2",
    sharpness: 288,
    planarity: 0.83,
    artifact: 0.35,
    match: 0.79,
  },
  {
    id: "p22",
    name: "Portable Speaker",
    sharpness: 396,
    planarity: 0.76,
    artifact: 0.88,
    match: 0.91,
  },
  {
    id: "p23",
    name: "Steel Lunch Box, 3 Tier",
    sharpness: 205,
    planarity: 0.27,
    artifact: 0.19,
    match: 0.74,
  },
  {
    id: "p24",
    name: "Denim Jacket, Women's",
    sharpness: 341,
    planarity: 0.12,
    artifact: 0.28,
    match: 0.82,
  },
  {
    id: "p25",
    name: "USB-C Charging Cable",
    sharpness: 44,
    planarity: 0.88,
    artifact: 0.91,
    match: 0.95,
  },
  {
    id: "p26",
    name: "Rattan Storage Basket",
    sharpness: 262,
    planarity: 0.36,
    artifact: 0.24,
    match: 0.68,
  },
  {
    id: "p27",
    name: "Analog Wrist Watch",
    sharpness: 279,
    planarity: 0.29,
    artifact: 0.2,
    match: 0.38,
  },
  {
    id: "p28",
    name: "Cushion Covers, Set of 5",
    sharpness: 148,
    planarity: 0.41,
    artifact: 0.3,
    match: 0.64,
  },
  {
    id: "p29",
    name: "Face Serum, 30ml",
    sharpness: 227,
    planarity: 0.81,
    artifact: 0.85,
    match: 0.89,
  },
  {
    id: "p30",
    name: "Trekking Backpack, 45L",
    sharpness: 384,
    planarity: 0.17,
    artifact: 0.26,
    match: 0.87,
  },
];
```

Distribution: 16 pass, 5 low correlation, 4 blurry, 5 flag.

## 5. Cascade function

```js
const T = { blur: 60, planarity: 0.65, artifact: 0.8, match: 0.55 };

function evaluate(p) {
  if (p.sharpness < T.blur)
    return { key: "blurry", gate: 1, message: "Too blurry, try again." };

  if (p.planarity > T.planarity && p.artifact > T.artifact)
    return {
      key: "flag",
      gate: 2,
      message: "Please send a real photo, not the same image.",
    };

  if (p.match < T.match)
    return { key: "low", gate: 3, message: "Low correlation, check again." };

  return { key: "pass", gate: 4, message: "Good to go." };
}
```

Do not reorder. Gate 2 must precede gate 3, because a screen recapture scores near 1.0 on match.

## 6. Demonstration cases

Four rows exist to be clicked during a walkthrough. Mark them in the sidebar with a small dot so the presenter can find them.

| Product              | Shows                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| `p14` Tempered Glass | Match 0.98 with a fraud verdict. Proves why one score fails.                           |
| `p25` USB-C Cable    | Would flag, but blur gate fires first. Proves gate order.                              |
| `p21` Wall Poster    | High planarity, low artifact, passes. Proves the AND condition protects flat products. |
| `p07` Wall Clock     | Same, on a second category.                                                            |

## 7. Image placeholders

No real images. Each pane renders a deterministic block.

- Derive a hue from the id: `hue = (charCodeSum * 37) % 360`.
- Display Picture pane: flat `hsl(hue, 18%, 92%)` fill, thin border, product name centred in mid-grey.
- Seller's Photo pane: same hue at `hsl(hue, 14%, 84%)`, plus a 2 degree rotation on an inner rectangle.

The visual difference between the two panes signals "studio versus handheld" without needing photos. Swapping in real `<img>` tags later is a one-component change.

Aspect ratio 1:1, matching marketplace catalog requirements.

## 8. Layout spec

**Shell.** Two columns. Sidebar fixed at 260px, main pane fluid, both full height, main pane scrolls independently.

**Sidebar.** Header "Products", count badge. Then a plain list of 30 buttons. Selected row gets a left border bar and a slightly darker background. Rows are 36px, single line, truncate with ellipsis. Scrollable.

**Main header.** Title left, "View Technical Report" button right.

**Empty state.** Centred, single line: "Please choose an image pair." No icon, no illustration.

**Loaded state.** Run button in a bar above the two image panes, right-aligned. Panes side by side, equal width, gap 24px. Each has its title above it.

**Sharpness** sits directly under the seller pane only. Under the display pane, print "Reference image" in the same slot to keep the two columns aligned. This asymmetry is the point and should not be hidden.

**Results block.** Appears below both panes after Run. Three parts, in order:

1. Verdict banner. Full width, left-aligned, verdict message in 18px, accent colour by verdict key.
2. Score strip. Three cells: Planarity, Screen artifact, Product match. Each shows label, value in monospace, and threshold in smaller mid-grey text ("cut-off 0.65"). Grey out cells the cascade never reached.
3. Cascade trace. Four short lines showing which gate fired and which were skipped. Example for `p25`:
   ```
   Gate 1  Sharpness 44 below 60          -> stopped here
   Gate 2  Planarity + screen artifact    not evaluated
   Gate 3  Product match                  not evaluated
   ```

The trace is what turns the demo from a lookup table into an explanation. Include it.

**Responsive.** Below 900px the sidebar collapses to a dropdown at the top and the image panes stack.

## 9. Design tokens

The subject is an internal trust and safety review tool. Instrument panel, not consumer product. Dense, quiet, numbers legible at a glance.

| Token    | Value     | Use                           |
| -------- | --------- | ----------------------------- |
| Surface  | `#EFF2F4` | App background                |
| Panel    | `#FFFFFF` | Sidebar, cards, image frames  |
| Ink      | `#1A2229` | Primary text                  |
| Mid      | `#5C6B7A` | Labels, thresholds, secondary |
| Hairline | `#DCE1E6` | Borders, dividers             |

Verdict accents, one per outcome:

| Verdict           | Hex       |
| ----------------- | --------- |
| Good to go        | `#1F7A50` |
| Low correlation   | `#B03028` |
| Too blurry        | `#A66A00` |
| Send a real photo | `#6B3FA0` |

Violet for the flag, not red. It separates fraud from mismatch at a glance, and red already means "wrong product".

**Type.** Two families. Inter for interface text. `ui-monospace` for every numeric value, because scores need tabular alignment and fixed width so they do not jump between products.

Scale: 24px title, 18px verdict, 14px body and list rows, 12px labels and thresholds. Sentence case throughout. No all-caps labels.

**Restraint.** The verdict banner is the only saturated element on screen. Everything else stays in the grey scale. No shadows, no gradients, no card stack. Borders and spacing carry the structure.

**Motion.** One transition only: results fade in over 150ms after Run. Nothing else animates.

## 10. Technical report modal

Trigger: header button, top right.

Implementation: full-screen overlay, white panel, max-width 760px, scrollable, close on Escape and on backdrop click. Move focus into the panel on open and back to the trigger on close.

Content: the technical report, inlined as a constant string and rendered as static JSX. Do not fetch a file, and do not add a markdown parser dependency for one document. Hand-convert the headings, tables and code blocks.

Sections to include, in order: scope and disclaimer, capture constraint, why one score fails, the four metrics, the cascade, cost table, limitations.

The disclaimer belongs at the top of the modal and nowhere else. Keep the main screen clean.

## 11. File structure

Single file, in this order:

```
1. PAIRS constant
2. T thresholds constant
3. VERDICTS lookup (key -> label, colour)
4. REPORT content constant
5. evaluate()
6. Placeholder component
7. ScoreCell component
8. CascadeTrace component
9. ResultsPanel component
10. ReportModal component
11. App (state, sidebar, main pane)
```

Roughly 450 to 550 lines. No routing, no state library, no external data.

## 12. Build order

1. Shell and sidebar with the 30 rows. Selection works, right pane prints the selected id.
2. Empty state and the two placeholder panes with titles.
3. Run button, `hasRun` state, fake delay.
4. `evaluate()` and the verdict banner.
5. Score strip with thresholds and greyed unreached cells.
6. Cascade trace.
7. Report modal.
8. Responsive pass, keyboard focus pass, `prefers-reduced-motion` on the one fade.

Each step is independently demoable. Stop at step 6 if time is short. The modal and responsive work are the removable parts.

## 13. Constraints

- No `localStorage` or `sessionStorage`. Component state only.
- No network calls of any kind.
- Every threshold read from the `T` constant, never typed inline in JSX. One place to tune.
- Do not store verdicts in `PAIRS`. Derive them.
