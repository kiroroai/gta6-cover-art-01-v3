# Neon Vice — GTA-Style Cover Art Maker

![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/kiroroai/gta6-cover-art-01-v3/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/kiroroai/gta6-cover-art-01-v3/reward.svg)

An entry for the make.fun bounty [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

A static, fully offline web app that turns your own photo into GTA-style
multi-panel cover art:

- **Cover view** — the featured artwork full-bleed at its native 4:3.
- **Editor** — a six-panel collage (Hero, Supercar, Helicopter, Airboat,
  Beach, Speedboat). Add a photo from your device (it is read locally and
  never uploaded), fill one panel or all of them, drag and zoom each panel,
  edit the title and caption, and pick a Sunset, Neon or Noir grade.
- **Details view** — zoomed crops of the featured artwork's own panels.
- **Back cover view** — the artwork beside a short blurb about the maker.
- **Export** — one click renders a PNG at 1080 × 1080, 1080 × 1350 or
  1920 × 1080.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

No build step, no network: every script, style and image the app loads is a
file under `app/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored `buildDossier` library.
