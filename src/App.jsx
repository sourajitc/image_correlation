import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// 1. PAIRS
// ---------------------------------------------------------------------------

// 16 products, 4 per verdict: blurry, low correlation (wrong product),
// flag (duplicate/screen recapture), good to go.
// display/real are filenames under public/images/{display_photos,real_photos}/.
const PAIRS = [
  { id: "p01", name: "Cotton Kurti, Set of 2", sharpness: 312, planarity: 0.14, artifact: 0.22, match: 0.81, display: "1. goodToGo women ethnic kurta and dupatta.avif", real: "1. goodToGo women ethnic kurta and dupatta.avif" },
  { id: "p03", name: "Bluetooth Neckband", sharpness: 244, planarity: 0.87, artifact: 0.92, match: 0.96, display: "2. bluetooth neckband.avif", real: "2. bluetooth neckband.jpeg" },
  { id: "p05", name: "Non-stick Dosa Tawa, 30cm", sharpness: 38, planarity: 0.22, artifact: 0.19, match: 0.61, display: "3. dosa tawa.avif", real: "3. dosa tawa.jpeg" },
  { id: "p06", name: "Men's Running Shoes, Size 9", sharpness: 289, planarity: 0.11, artifact: 0.24, match: 0.31, display: "4. mens running shoes.avif", real: "4. mens running shoes.avif" },
  { id: "p07", name: "Wall Clock, Wooden Frame", sharpness: 355, planarity: 0.79, artifact: 0.27, match: 0.84, display: "5. wall clock.avif", real: "5. wall clock.avif" },
  { id: "p09", name: "Laptop Sleeve, 15.6in", sharpness: 331, planarity: 0.91, artifact: 0.89, match: 0.94, display: "6. laptop sleeve.avif", real: "6. laptop sleeve.jpeg" },
  { id: "p10", name: "Wireless Mouse", sharpness: 213, planarity: 0.24, artifact: 0.18, match: 0.42, display: "7. wireless mouse.avif", real: "7. wireless mouse.avif" },
  { id: "p12", name: "Storage Containers, 6pc", sharpness: 51, planarity: 0.31, artifact: 0.26, match: 0.58, display: "8. Storage Containers.avif", real: "8. storage containers.jpeg" },
  { id: "p14", name: "Red Black Casual Tshirt for Men", sharpness: 188, planarity: 0.94, artifact: 0.96, match: 0.98, display: "9. Red Black Casual Tshirt for Men.avif", real: "9. Red Black Casual Tshirt for Men.jpeg" },
  { id: "p16", name: "Gojo Satorou Anime Poster", sharpness: 241, planarity: 0.33, artifact: 0.21, match: 0.47, display: "10. Gojo Satoru Anime Poster.avif", real: "10. Gojo Satoru Anime Poster.avif" },
  { id: "p18", name: "Squiggly LED Table Lamp", sharpness: 22, planarity: 0.18, artifact: 0.25, match: 0.66, display: "11. Squiggly LED Table Lamp.jpeg", real: "11. Squiggly LED Table Lamp.jpeg" },
  { id: "p20", name: "Sports Water Jug, 2L", sharpness: 317, planarity: 0.13, artifact: 0.22, match: 0.19, display: "12. Sports Water Jug.avif", real: "12. Sports Water Jug.avif" },
  { id: "p21", name: "Printed Wall Poster, A2", sharpness: 288, planarity: 0.83, artifact: 0.35, match: 0.79, display: "13. printed wall poster.avif", real: "13. printed wall poster.jpeg" },
  { id: "p22", name: "Portable Speaker", sharpness: 396, planarity: 0.76, artifact: 0.88, match: 0.91, display: "14. portable speakers.avif", real: "14. portable speakers.jpeg" },
  { id: "p24", name: "Denim Jacket, Women's", sharpness: 341, planarity: 0.12, artifact: 0.28, match: 0.82, display: "15. women's denim jacket.avif", real: "15. women's denim jacket.avif" },
  { id: "p25", name: "Analog Watch Unisex", sharpness: 44, planarity: 0.88, artifact: 0.91, match: 0.95, display: "16. Analog Watch.avif", real: "16. analog watch.jpeg" },
];

function imageUrl(folder, filename) {
  return `/images/${folder}/${encodeURIComponent(filename)}`;
}

// ---------------------------------------------------------------------------
// 2. Thresholds
// ---------------------------------------------------------------------------

const T = { blur: 60, planarity: 0.65, artifact: 0.8, match: 0.55 };

// ---------------------------------------------------------------------------
// 3. VERDICTS lookup
// ---------------------------------------------------------------------------

const VERDICTS = {
  blurry: { label: "Too blurry, try again", colorClass: "text-verdict-blurry", borderClass: "border-verdict-blurry" },
  flag: { label: "Please send a real photo, not the same image.", colorClass: "text-verdict-flag", borderClass: "border-verdict-flag" },
  low: { label: "Low correlation, check again.", colorClass: "text-verdict-low", borderClass: "border-verdict-low" },
  pass: { label: "Good to go.", colorClass: "text-verdict-pass", borderClass: "border-verdict-pass" },
};

// ---------------------------------------------------------------------------
// 4. REPORT content
// ---------------------------------------------------------------------------

const REPORT = (
  <>
    <section className="mb-6 rounded-sm border border-hairline bg-surface px-4 py-3 text-sm text-ink">
      <p className="font-semibold">Scope &amp; disclaimer</p>
      <p className="mt-1 text-mid">
        This is a demo, values are hardcoded. This document explains the reasoning behind the scoring
        structure, along with the recommended models based on research.
      </p>
    </section>

    <h3 className="mb-2 text-base font-semibold text-ink">Capture constraint</h3>
    <p className="mb-1 text-sm text-mid">
      The seller would only be allowed to capture a photo, eliminating the possibility of workarounds through
      re-uploading the product&rsquo;s display image.
    </p>
    <p className="mb-4 text-sm text-mid">
      <span className="font-semibold text-ink">Scope:</span> along with the display image, the seller can be
      given the freedom to provide a real photo during registration of any product, for this exact verification
      process, to avoid any mis-flaggings on our end.
    </p>

    <h3 className="mb-2 text-base font-semibold text-ink">The sequential checks &amp; recommended models</h3>

    <div className="mb-4 rounded-sm border border-hairline">
      <div className="border-b border-hairline p-3">
        <p className="text-sm font-semibold text-ink">1. Sharpness</p>
        <p className="mt-1 text-sm text-mid">
          Flags blurry photos. Computed on the seller&rsquo;s photo using basic OpenCV (Laplacian convolution).
        </p>
      </div>
      <div className="border-b border-hairline p-3">
        <p className="text-sm font-semibold text-ink">2. Planarity &amp; screen artifact</p>
        <p className="mt-1 text-sm text-mid">
          Avoids a potential workaround: clicking a photo of the display picture itself.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-mid">
          <li>ORB keypoints + a RANSAC-fit homography, to check whether the object is flat like a screen.</li>
          <li>Segmentation + a Hough transform, to check for a screen bezel edge around the product.</li>
        </ul>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-ink">3. Product match</p>
        <p className="mt-1 text-sm text-mid">
          Post-segmentation, both photos are compared using DINOv2, an open-weights vision model.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-mid">
          <li>Each image is encoded into an embedding, and then compared with cosine similarity.</li>
          <li>DINOv2 is especially good for instance-level matching: matching the physical item, not category.</li>
        </ul>
      </div>
    </div>

    <h3 className="mb-2 text-base font-semibold text-ink">Root cause tracing</h3>
    <pre className="mb-4 overflow-x-auto rounded-sm border border-hairline bg-surface p-3 font-mono text-xs text-ink">
{`1. sharpness < T_blur                          -> "Too blurry, try again"
2. planarity > 0.65 AND screen_artifact fires  -> "Please send a real photo"
3. product_match < 0.55                        -> "Low correlation, check again"
4. else                                        -> "Good to go"`}
    </pre>

    <h3 className="mb-2 text-base font-semibold text-ink">Cost</h3>
    <p className="mb-2 text-sm text-mid">
      All components are open-weights or classical computer vision, CPU-runnable, no API calls. Estimated
      marginal cost is well under Rs 0.01 per check on commodity cloud CPU; image storage and bandwidth likely
      exceed inference cost.
    </p>
  </>
);

// ---------------------------------------------------------------------------
// 5. evaluate()
// ---------------------------------------------------------------------------

function evaluate(p) {
  if (p.sharpness < T.blur) return { key: "blurry", gate: 1, message: "Too blurry, try again." };

  if (p.planarity > T.planarity && p.artifact > T.artifact)
    return { key: "flag", gate: 2, message: "Please send a real photo, not the same image." };

  if (p.match < T.match) return { key: "low", gate: 3, message: "Low correlation, check again." };

  return { key: "pass", gate: 4, message: "Good to go." };
}

// ---------------------------------------------------------------------------
// 6. Placeholder
// ---------------------------------------------------------------------------

function hueFromId(id) {
  const sum = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (sum * 37) % 360;
}

// Measures a container and reports the largest square that fits inside it,
// so the image pair always fills exactly the space left after the header,
// run bar, titles/captions and results block — no fixed guess, never overflows.
// Uses a callback ref (not a plain ref) so the observer re-attaches whenever
// the container mounts — e.g. when the empty state gives way to the loaded
// state, at which point a plain ref's identity wouldn't change but its
// .current would, and a dependency-array effect would miss that.
function useSquareFit() {
  const [node, setNode] = useState(null);
  const [size, setSize] = useState(0);

  useLayoutEffect(() => {
    if (!node) return;

    function measure() {
      setSize(Math.max(0, Math.floor(Math.min(node.clientWidth, node.clientHeight))));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, size];
}

function Placeholder({ id, name, variant, size, src }) {
  if (src) {
    return (
      <div
        className="overflow-hidden rounded-sm border border-hairline"
        style={{ width: size, height: size }}
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  const hue = hueFromId(id);
  const fill = variant === "seller" ? `hsl(${hue}, 14%, 84%)` : `hsl(${hue}, 18%, 92%)`;

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-sm border border-hairline"
      style={{ backgroundColor: fill, width: size, height: size }}
    >
      {variant === "seller" ? (
        <div
          className="flex h-4/5 w-4/5 items-center justify-center border border-hairline/70 p-3 text-center"
          style={{ transform: "rotate(2deg)" }}
        >
          <span className="text-sm text-mid">{name}</span>
        </div>
      ) : (
        <span className="px-3 text-center text-sm text-mid">{name}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. ScoreCell
// ---------------------------------------------------------------------------

function ScoreCell({ label, value, threshold }) {
  return (
    <div className="flex-1 rounded-sm border border-hairline bg-panel px-3 py-2">
      <p className="text-xs text-mid">{label}</p>
      <p className="mt-0.5 font-mono text-base text-ink">{value.toFixed(2)}</p>
      <p className="mt-0.5 text-xs text-mid">cut-off {threshold}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. CascadeTrace
// ---------------------------------------------------------------------------

function buildTraceLines(p, result) {
  const lines = [];

  lines.push({
    gate: 1,
    text: `Sharpness ${p.sharpness} ${p.sharpness < T.blur ? "below" : "above"} ${T.blur}`,
    status: result.gate === 1 ? "stopped" : "passed",
  });

  if (result.gate > 1) {
    lines.push({
      gate: 2,
      text: `Planarity ${p.planarity.toFixed(2)} + screen artifact ${p.artifact.toFixed(2)}`,
      status: result.gate === 2 ? "stopped" : "passed",
    });
  } else {
    lines.push({ gate: 2, text: "Planarity + screen artifact", status: "not-evaluated" });
  }

  if (result.gate > 2) {
    lines.push({
      gate: 3,
      text: `Product match ${p.match.toFixed(2)}`,
      status: result.gate === 3 ? "stopped" : "passed",
    });
  } else {
    lines.push({ gate: 3, text: "Product match", status: "not-evaluated" });
  }

  return lines;
}

const STATUS_LABEL = {
  stopped: "-> stopped here",
  passed: "-> passed",
  "not-evaluated": "not evaluated",
};

function CascadeTrace({ pair, result }) {
  const lines = useMemo(() => buildTraceLines(pair, result), [pair, result]);

  return (
    <div className="rounded-sm border border-hairline bg-panel px-3 py-2">
      <p className="mb-1 text-xs text-mid">Root cause</p>
      <div className="space-y-1 font-mono text-xs">
        {lines.map((line) => (
          <div key={line.gate} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <span className={line.status === "not-evaluated" ? "text-mid opacity-60" : "text-ink"}>
              Gate {line.gate}&nbsp;&nbsp;{line.text}
            </span>
            <span className={line.status === "stopped" ? "text-accent" : "text-mid"}>
              {STATUS_LABEL[line.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. ResultsPanel
// ---------------------------------------------------------------------------

function ResultsPanel({ pair, result }) {
  const verdict = VERDICTS[result.key];
  // Only render cells the cascade actually reached — a gate that stopped
  // the check short means the metrics after it were never computed.
  const reachedPlanarityArtifact = result.gate >= 2;
  const reachedMatch = result.gate >= 3;

  return (
    <div className="mt-4 shrink-0 animate-fade-in motion-reduce:animate-none space-y-3">
      <div className={`rounded-sm border-l-4 bg-panel px-3 py-2 ${verdict.borderClass}`}>
        <p className={`text-base font-medium ${verdict.colorClass}`}>{result.message}</p>
      </div>

      {(reachedPlanarityArtifact || reachedMatch) && (
        <div className="flex flex-col gap-2 cols:flex-row">
          {reachedPlanarityArtifact && (
            <>
              <ScoreCell label="Planarity" value={pair.planarity} threshold={T.planarity} />
              <ScoreCell label="Screen artifact" value={pair.artifact} threshold={T.artifact} />
            </>
          )}
          {reachedMatch && <ScoreCell label="Product match" value={pair.match} threshold={T.match} />}
        </div>
      )}

      <CascadeTrace pair={pair} result={result} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. ReportModal
// ---------------------------------------------------------------------------

function ReportModal({ open, onClose, triggerRef }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Technical report"
        className="my-8 w-full max-w-[760px] rounded-sm bg-panel p-6 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Seller photo verification: technical report</h2>
          <button
            onClick={onClose}
            className="rounded-sm border border-hairline px-3 py-1 text-sm text-mid hover:bg-surface"
          >
            Close
          </button>
        </div>
        {REPORT}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11. App
// ---------------------------------------------------------------------------

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const reportTriggerRef = useRef(null);
  const [imageWrapRef, squareSize] = useSquareFit();

  const selected = PAIRS.find((p) => p.id === selectedId) ?? null;
  const result = selected && hasRun ? evaluate(selected) : null;

  function handleSelect(id) {
    if (id === selectedId) return;
    setSelectedId(id);
    setHasRun(false);
  }

  function handleRun() {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setHasRun(true);
    }, 400);
  }

  return (
    <div className="flex h-screen flex-col cols:flex-row bg-surface text-ink font-sans">
      {/* Sidebar (collapses to a dropdown below 900px) */}
      <aside className="flex w-full flex-col border-b border-hairline cols:h-full cols:w-[300px] cols:border-b-0 cols:border-r">
        <div className="flex items-center justify-between bg-header px-4 py-2 text-white cols:h-12">
          <span className="text-sm font-semibold">Products</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-header">
            {PAIRS.length}
          </span>
        </div>

        {/* Dropdown, small screens only */}
        <div className="p-3 cols:hidden">
          <select
            className="w-full rounded-sm border border-hairline bg-panel px-3 py-2 text-sm text-ink"
            value={selectedId ?? ""}
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="" disabled>
              Choose a product
            </option>
            {PAIRS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* List, medium screens and up */}
        <div className="hidden cols:block cols:flex-1 cols:overflow-y-auto">
          {PAIRS.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`flex h-9 w-full items-center gap-2 truncate border-l-2 px-4 text-left text-sm ${
                  isSelected
                    ? "border-accent bg-surface font-medium text-ink"
                    : "border-transparent text-mid hover:bg-surface/60"
                }`}
                title={p.name}
              >
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main pane */}
      <main className="flex h-full flex-1 flex-col overflow-y-auto">
        <div className="flex shrink-0 items-center justify-between bg-header px-6 py-2 text-white cols:h-12">
          <h1 className="text-lg font-semibold sm:text-2xl">Product Validation using Image Correlation</h1>
          <button
            ref={reportTriggerRef}
            onClick={() => setReportOpen(true)}
            className="shrink-0 rounded-sm bg-accent px-3 py-1.5 text-sm font-semibold text-header hover:brightness-95"
          >
            View Technical Report
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-sm text-mid">
              Select a Product from the Sidebar
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 flex shrink-0 justify-center">
                <button
                  onClick={handleRun}
                  disabled={checking}
                  className="rounded-sm bg-accent px-3 py-1.5 text-sm font-semibold text-header disabled:opacity-60"
                >
                  {checking ? "Checking..." : "Run Correlation Check"}
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-6 cols:flex-row">
                <div className="flex min-h-0 flex-1 flex-col items-center">
                  <p className="mb-1 shrink-0 rounded-sm bg-header px-3 py-1 text-base font-bold text-white">Display Picture</p>
                  <div ref={imageWrapRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
                    <Placeholder
                      id={selected.id}
                      name={selected.name}
                      variant="dp"
                      size={squareSize}
                      src={selected.display ? imageUrl("display_photos", selected.display) : undefined}
                    />
                  </div>
                  <p className="mt-1 shrink-0 text-xs text-mid">Reference image</p>
                </div>
                <div className="flex min-h-0 flex-1 flex-col items-center">
                  <p className="mb-1 shrink-0 rounded-sm bg-header px-3 py-1 text-base font-bold text-white">Seller&rsquo;s Photo</p>
                  <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                    <Placeholder
                      id={selected.id}
                      name={selected.name}
                      variant="seller"
                      size={squareSize}
                      src={selected.real ? imageUrl("real_photos", selected.real) : undefined}
                    />
                  </div>
                  <p className="mt-1 shrink-0 font-mono text-xs text-mid">Sharpness {selected.sharpness}</p>
                </div>
              </div>

              {result && <ResultsPanel pair={selected} result={result} />}
            </div>
          )}
        </div>
      </main>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} triggerRef={reportTriggerRef} />
    </div>
  );
}
