# Seller Photo Verification: Technical Report

## Scope

This prototype is a demonstration. All scores shown in the UI are hardcoded. No model is executed.

This document specifies how each displayed metric would be computed in a real build, why it exists, and the rules that convert the metrics into a seller-facing verdict.

## Problem

Compare two images:

1. **Display Picture (DP)** — the catalog image on the listing.
2. **Seller's Photo** — a live photo of the same product, captured in-app.

Return one of four verdicts:

| Verdict                      | Meaning                                |
| ---------------------------- | -------------------------------------- |
| Too Blurry, try again        | Photo unusable                         |
| Please send a real photo     | Seller photographed the DP on a screen |
| Low Correlation, Check Again | Different product                      |
| Good To Go                   | Verified                               |

## Capture constraint

The seller cannot upload a file. Capture is camera-only, in-app.

This removes file re-upload, screenshots, and crops from the threat model. It also removes EXIF checks and perceptual hashing as useful gates. Both were designed for attacks this constraint already blocks.

One attack survives: the seller displays the DP on a monitor and photographs it. Every fraud signal below targets that case.

## Why a single similarity score fails

A screen recapture scores **higher** on product similarity than an honest photo.

An honest photo compares a real object under new lighting to a studio image. A recapture compares the DP to itself. Similarity is therefore non-monotonic with correctness. Fraud sits above pass, pass sits above mismatch.

Two orthogonal axes are required:

- **Content**: is it the same object?
- **Geometry**: is the subject a flat surface or a real 3D object?

---

## Metrics

### 1. Sharpness

**Computed on**: Seller's Photo only. The DP is catalog-grade by definition.

**Method**: Convert to grayscale. Convolve with a 3x3 Laplacian operator. Take the variance of the response.

**Rationale**: Sharp images have strong second-derivative responses at edges. Blur smears edges and collapses the variance.

**Cost**: ~5ms, OpenCV, zero marginal cost.

**Known limitation**: The score measures edge and texture density, not focus. A sharp photo of a plain object on a plain wall scores low. Mitigation: compute inside the product mask only, and normalise by mask area.

**Why it runs first**: Blur degrades keypoint detection and embedding quality. Every downstream score is unreliable on a blurry input.

---

### 2. Planarity

**Computed on**: Both images, pairwise, after segmentation.

**Method**:

1. Detect ORB keypoints in both crops.
2. Match descriptors.
3. Fit a single homography with RANSAC.
4. Score = inlier ratio, weighted by spatial spread of inliers.

**Rationale**: A monitor is flat and the DP is a 2D image. Every correspondence between a recapture and the DP is explained by one global homography. This is exact projective geometry, not an approximation. ORB is scale and rotation invariant, so features survive the perspective warp and scale change.

A real 3D object photographed from a new angle has parallax. No single homography fits correspondences at different depths. Folds, shadows and specular highlights move independently.

**Discriminator**:

|                  | Inlier ratio | Inlier distribution               |
| ---------------- | ------------ | --------------------------------- |
| Screen recapture | High         | Spread across product region      |
| Honest photo     | Low          | Clustered on locally flat patches |

**Cost**: ~20ms, OpenCV, zero marginal cost.

**Known limitation**: Flat products false-positive. Posters, book covers, phone cases, flat-lay garments. A genuine photo of a flat object is also single-homography. This is why planarity alone does not trigger the flag.

---

### 3. Screen Artifact

**Computed on**: Seller's Photo only.

**Method**: Segment the product. Analyse the annulus of pixels immediately outside the mask.

- **Annulus uniformity**: variance of colour and luminance in the ring.
- **Bezel edge**: Hough transform for long straight high-contrast lines.

**Rationale**: In an honest photo the background is the seller's room. Textured, unevenly lit, arbitrary colour. In a recapture the background is the DP's own background, which is near-uniform white for a compliant catalog image, terminating at a hard rectangular monitor edge.

**Optional third signal**: FFT of the crop, checking for periodic off-DC peaks from moiré. Aliasing between the display pixel grid and the camera sensor array. Weak alone and degrading on OLED and 4K panels. Use as a tiebreaker only.

**Cost**: ~10ms, zero marginal cost.

**Role**: Corroborating evidence. Resolves the flat-product false positive in the planarity check.

---

### 4. Product Match

**Computed on**: Each image individually, then compared.

**Architecture**: Twin-tower. DINOv2 is a single-image encoder. There is no two-image input mode.

```
DP      -> segment -> crop -> DINOv2 -> vector A (768-d)  [cached]
Seller  -> segment -> crop -> DINOv2 -> vector B (768-d)
                                     -> cosine(A, B)
```

The only pairwise operation is one dot product.

**Model choice**: DINOv2 ViT-S/14, not CLIP.

CLIP is trained on image-text pairs and clusters by concept. Two different red kurtis can score higher than two photos of the same kurti. DINOv2 is self-supervised and encodes visual structure without text alignment, which makes it stronger for instance-level retrieval. On instance recognition benchmarks DINOv2 features outperform prior self-supervised methods by +41% mAP on Oxford-Hard. DINOv3 improves further, including +7.6 points on AmsterTime, a benchmark matching modern photos to archival images of the same subject.

This task is instance-level. Is this the same physical item, not is this the same category.

**Why segmentation matters**: Without it, the comparison is dominated by background. Studio white versus a bedsheet under a tubelight. That variance is guaranteed to differ even on a perfect match.

|                   | Without segmentation                | With segmentation |
| ----------------- | ----------------------------------- | ----------------- |
| True pair cosine  | ~0.55 to 0.75                       | ~0.75 to 0.88     |
| False pair cosine | Inflated by shared white background | Suppressed        |

Segmentation via `rembg` (U2-Net), ~200ms CPU, free.

**Caching**: Vector A is fixed per listing. Embed once at listing time, store 768 floats (~3KB). Each verification is one forward pass, not two.

**Cost**: ~80 to 150ms CPU, open weights, zero marginal cost.

**Known limitation**: Threshold is catalogue-dependent. Reported DINOv2 versus CLIP performance varies sharply by domain. Setting the threshold requires a few hundred labelled pairs from the actual catalogue.

---

## Decision cascade

Order is load-bearing.

```
1. sharpness < T_blur                            -> "Too Blurry, try again"
2. planarity > 0.65 AND screen_artifact fires    -> "Please send a real photo"
3. product_match < 0.55                          -> "Low Correlation, Check Again"
4. else                                          -> "Good To Go"
```

**Gate 1 first**: Blur corrupts keypoints and embeddings. Score nothing on an unusable input.

**Gate 2 before Gate 3**: A recapture scores near 1.0 on product match. Checking pass conditions first would approve every fraud case.

**The AND in Gate 2**: Two independent signals are required. Planarity alone falsely accuses sellers of flat products. Requiring corroboration keeps that population safe.

**Gate 3 last**: Only reached once the photo is usable and confirmed to be a real 3D capture.

---

## Cost

All components are open weights or classical computer vision. CPU-runnable. No API calls.

| Stage                        | Latency                     |
| ---------------------------- | --------------------------- |
| Sharpness                    | ~5ms                        |
| Segmentation (x1, DP cached) | ~200ms                      |
| Planarity                    | ~20ms                       |
| Screen artifact              | ~10ms                       |
| Embedding (x1, DP cached)    | ~100ms                      |
| **Total**                    | **~350ms per verification** |

Estimated marginal cost is well under Rs 0.01 per check on commodity cloud CPU. Image storage and bandwidth likely exceed inference cost.

A hosted vision-language model asked to judge similarity directly would cost roughly 100x to 1000x more per call and would be non-deterministic. Not recommended, except possibly as an escalation tier for the ambiguous band.

---

## Prototype display

| Panel                | Metric          | Shown                       |
| -------------------- | --------------- | --------------------------- |
| Under Seller's Photo | Sharpness       | Always                      |
| Pairwise             | Planarity       | Always                      |
| Pairwise             | Product Match   | Always                      |
| Flag explanation     | Screen Artifact | Only when planarity is high |

The most instructive demo case is the recapture: high product match sitting next to a fraud verdict. It shows why the cascade order exists.

---

## Industry context

Marketplaces currently enforce static compliance on listing images. Flipkart requires minimum 500x500 px, JPEG or PNG under 8MB. Meesho requires JPEG only, minimum 500x500, product filling 90% of frame, white background mandatory. These are rules, not correlation.

Product accuracy is enforced in policy but is hard to verify. Meesho, Amazon India, Flipkart and Myntra all require that the listing image accurately shows the product shipped. The stated motivation is returns and trust.

Layered forensic pipelines of this type exist commercially, sold by fraud-detection vendors, including live recapture-verified camera sessions. We found no public confirmation that Indian marketplaces run an internal seller-photo-versus-listing similarity check. Treat that as unverified.

---

## Open items

1. Thresholds require calibration on real catalogue data.
2. Flat-product categories need validation of the planarity plus artifact combination.
3. Screen artifact detection degrades on high-end displays. A trained recapture classifier is the upgrade path if evasion increases.
