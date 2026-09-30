# TransfHAR project page

Results page for *TransfHAR: Self-Supervised Wrist Representations for On-Demand Activity Recognition* (UIST '26).
One view for everyone: headline results, an activity explorer (pick any of 127 activities to see how well it is
recognized and what it is confused with) and a leaderboard. The selected activity is kept in the URL so results can
be shared as links. Design source: Claude Design project "TransfHAR Results".

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

Set `BASE` when the site is served from a subpath, e.g. `BASE=/TransfHAR-web/ npm run build`.

## Data

Everything is rendered at runtime from `public/data/`:

- `paper.json`: curated from the paper (tables, stated numbers, taxonomy, user-study design, activity bank).
  Values the paper doesn't state numerically are left out rather than read off plots.
- `confusions.json`: the Figure 14 (SAMoSA, UTD-MHAD, PrISM latte) and Figure 15 (P1–P10) confusion matrices,
  extracted from the PDF text by `npm run data` (`scripts/extract_confusions.py`, needs poppler's `pdftotext`).

`res/TransfHAR.pdf` is the source paper. The research code (SPICExLAB/IMU-SSL, private) can be checked out at `res/IMU-SSL`; it is git-ignored and not needed to build the site.

## Deploy

`.github/workflows/pages.yml` builds and deploys to GitHub Pages on every push to `main`. Enable Pages with
"GitHub Actions" as the source. For a custom domain, set the repository variable `PAGES_BASE` to `/`.
