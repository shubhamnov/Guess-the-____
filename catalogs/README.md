# Catalogs: content and refresh workflow

This folder is the source of truth for the planned expansion of **Guess the ____** catalogs.

## Working rules

- Build one category at a time, starting with **Guess the Landmark**.
- Aim for 100 approved questions per new category. A target is not a claim that the questions already exist or are validated.
- Work in small batches, inspect the existing catalog before extending it, and avoid broad rewrites.
- Keep question content in versioned local files. Do not fetch random questions or image-search results during gameplay.
- Keep optimized image assets local to the site. Record the original source page, source URL, creator, and license for every external image. Landmark images are cached as WebP by the GitHub Actions workflow in `.github/workflows/cache-landmark-images.yml`.
- Do not add new categories to the Daily Mix or change its existing 14-question format until the new standalone catalogs are ready and explicitly reviewed.
- Preserve previous versions. Do not silently replace a catalog that is referenced by a published daily challenge.

## Record format

Every question must have a stable ID and, at minimum:

- `id`: stable, unique identifier such as `landmark_001`
- `category`: catalog ID
- `type`: supported question format, e.g. `image_multiple_choice`
- `prompt`: player-facing question
- `image.path`: local path relative to the site root
- `image.sourceUrl`, `image.creator`, `image.license`: provenance and rights information
- `options`: answer choices
- `answerId`: the ID of the correct option, not a separately typed answer string
- `explanation`: a short fact shown after answering
- `difficulty`: `easy`, `medium`, or `hard`
- `status`: `draft`, `needs_review`, or `approved`

Avoid embedding the full image as base64 in JSON. Use a compressed image file and reference it by path.

## Validation before approval

A question is publishable only when all applicable checks pass:

1. IDs are unique and stable; no duplicate question records.
2. The correct answer exists exactly once in the options; options are non-empty and unambiguous.
3. The factual answer and explanation are verified against a reliable source.
4. The image actually depicts the named subject and is accessible from its local path.
5. Image source, creator, and license/permission are recorded; do not assume an image is reusable merely because it is publicly viewable.
6. No broken image references, malformed records, or missing required fields.
7. The category's approved count is reported separately from drafts and records awaiting review.

For landmark and geography content, distinguish the subject's name, location, and country carefully. For cuisine, distinguish a dish's historical origin from places where it is popular today.

## Refresh bookkeeping

Update `manifest-v1.json` whenever a category is created or refreshed:

- `currentVersion`: current published catalog version, or `null` until one exists
- `approvedQuestions`: count of validated, publishable records
- `lastRefreshedAt`: date of the actual content refresh; use `null` if it is not known
- `refreshHistory`: append a dated summary of additions, revisions, and retirements

Never invent a last-refresh date. Record the commit SHA in the refresh entry when available. Use a new versioned filename for a breaking or history-sensitive catalog update rather than overwriting the prior snapshot.

## Current first milestone

The manifest marks **Guess the Landmark** as the first catalog in progress. The working catalog now contains **20 draft questions across two batches** toward the 100-question target. Each question includes four answer choices, an explanation, a fact source, and a Wikimedia Commons image reference with creator/license attribution. The user confirmed the landmark identities in the first batch; the overall catalog is still marked as draft because image rendering in the published browser has not yet been verified. The standalone game draws **10 random questions per round**, so the catalog can grow without making each round longer.

The landmark game is being switched to locally cached WebP images. A GitHub Actions workflow downloads each Wikimedia Commons source, optimizes it, stores it under `assets/landmarks/`, and rewrites the catalog to use local paths while retaining attribution and license metadata. The workflow must complete successfully and the published GitHub Pages game must render the local images before questions are marked approved.

The existing Daily Challenge snapshot is intentionally unchanged.


## Shared flag images

The Daily Mix and Guess the Flag games use locally cached flag images under `assets/flags/` instead of fetching flags from FlagCDN during play. `scripts/cache_flag_images.py` builds 320px-wide WebP versions from the flag-code list in `daily-challenge-data-v1.js`; the source data and date-seeded Daily Mix question order remain unchanged.


## Main-game image caching

- Daily Mix and Guess the Flag use locally cached WebP flag images under `assets/flags/`.
- The cache contains 195 flag codes and totals about 366 KB.
- The Daily Mix question snapshot and brand-logo snapshot are unchanged. Question selection and answer choices remain deterministic for a given UTC date so shared challenge links match for everyone.

## Guess the Cuisine

- The first 20 questions are in `catalogs/cuisines-v1.json`, with a 100-question target. Questions are in two curated batches of 10.
- The standalone game is at `guess-the-cuisine/index.html`.
- Cuisine photos are optimized into local WebP files under `assets/cuisines/`; creator, license, original image source and fact-source metadata are retained.
- All 20 questions remain drafts until image rendering is checked in the published GitHub Pages site.
