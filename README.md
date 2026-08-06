<div align="center">

<img src="docs/pfp.png" width="230" alt="A FrameInGoa profile frame: circular photo inside a deep-green ring with HACKER HOUSE गोवा arced along the top and GOA '26 · #FrameInGoa along the bottom">

# FrameInGoa

**Your details + a photo → a Hacker House Goa 2026 event ID card, *and* a branded profile frame.**
Two taps. No login. Nothing leaves your phone until you choose to share.

`#FrameInGoa`

<br>

![Next.js](https://img.shields.io/badge/Next.js-15.5-000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-087EA4?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Canvas](https://img.shields.io/badge/rendering-100%25%20client--side-1E4D2B?style=flat-square)
![Env](https://img.shields.io/badge/env%20vars-all%20optional-F2B705?style=flat-square&labelColor=17130E)

</div>

---

## The two exports

<table>
<tr>
<td width="42%" align="center"><img src="docs/pfp.png" width="300" alt="1080×1080 profile frame"><br><sub><b>Format A — PFP Frame</b><br>1080 × 1080 · circular crop · legible at 48px</sub></td>
<td width="58%" align="center"><img src="docs/card.jpg" width="330" alt="1080×1350 Builder ID card showing name, role, college and a masked phone number"><br><sub><b>Format B — Builder ID Card</b><br>1080 × 1350 · 4:5, full-bleed in the X feed</sub></td>
</tr>
</table>

The ID card takes **photo · name · role in the team · college · phone**. Rows collapse when a field is left blank, so a sparse card still looks composed rather than half-empty.

> [!IMPORTANT]
> **The phone number is never printed in full.** The form collects it so an organiser can match a person at check-in, but the card renders only the last two digits — `••••10`. This graphic is built to be posted publicly, and a full number on a public image is a number handed to every stranger who sees the post. Masking happens at the render boundary in [`maskPhone`](lib/titles.ts), and there is deliberately no code path that draws the raw value.

And a third the user never sees — a 1200×630 Open Graph variant, composed **client-side** from the same canvas, so a shared link unfurls with the actual card instead of a blank thumbnail:

<div align="center"><img src="docs/og-preview.jpg" width="720" alt="1200×630 Open Graph card showing the Builder ID beside the Hacker House गोवा wordmark and #FrameInGoa"></div>

---

## The flow, in two taps

<table>
<tr>
<td align="center"><img src="docs/ui-01-upload.jpg" width="150"><br><sub>1 · pick</sub></td>
<td align="center"><img src="docs/ui-02-editor.jpg" width="150"><br><sub>2 · frame it</sub></td>
<td align="center"><img src="docs/ui-04-cardform.jpg" width="150"><br><sub>3 · your details</sub></td>
<td align="center"><img src="docs/ui-05-card-result.jpg" width="150"><br><sub>4 · post</sub></td>
</tr>
</table>

---

## Architecture

The whole product is a **rendering pipeline that happens to have a UI bolted to the front**. Nothing round-trips a server to produce a pixel — that is the entire reason it feels instant.

```
                                  ╱────────────────────────────────────────────╲
                                 ╱   app/page.tsx · Uploader · Editor · Card    ╲
             ┌──────────────────╱     Form · ResultActions · Toast              ╲
             │   UI LAYER      ╱          "use client" · Tailwind v4             ╲
             │                ╱──────────────────────────────────────────────────╲
             │               │                     │                              │
             │               │                     ▼  RenderInput                 │
             ├───────────────┼────────────────────────────────────────────────────┤
             │              ╱────────────────────────────────────────────────────╲
             │             ╱  lib/image.ts    lib/transform.ts    lib/titles.ts   ╲
             │  DOMAIN    ╱   decode·EXIF     cover-fit·clamp     FNV-1a hash      ╲
             │  LAYER    ╱    HEIC·downscale  pan·pinch·zoom      deterministic     ╲
             │          ╱──────────────────────────────────────────────────────────╲
             │         │                      │                                     │
             │         │                      ▼  design-space draw calls            │
             ├─────────┼─────────────────────────────────────────────────────────────┤
             │        ╱──────────────────────────────────────────────────────────────╲
             │       ╱   lib/render.ts  ─── compositors ──▶  drawPfp · drawCard · OG  ╲
             │ CANVAS╱    lib/canvasKit.ts ─ primitives ──▶  arcText · grain · palm    ╲
             │ LAYER╱     lib/fonts.ts ──── FontFace ─────▶  await before ANY fillText  ╲
             │     ╱────────────────────────────────────────────────────────────────────╲
             │    │                        │                                             │
             │    │                        ▼  PNG Blob                                   │
             ├────┼─────────────────────────────────────────────────────────────────────┤
             │   ╱──────────────────────────────────────────────────────────────────────╲
             │  ╱  lib/share.ts ──▶ ① Web Share (files)  ② X intent + /c/{id}  ③ download ╲
             │ ╱   api/cards ─ Vercel Blob      api/counter ─ Upstash INCR (both optional) ╲
             │╱────────────────────────────────────────────────────────────────────────────╲
             └──────────────────────────────────────────────────────────────────────────────┘
                EDGE LAYER — the only code that can touch a network. All of it degrades to a
                             working app when every single env var is absent.
```

### Module graph

```mermaid
graph TD
    subgraph UI["🖐️  UI  ·  client components"]
        P[app/page.tsx<br/><i>state machine</i>]
        U[Uploader]
        E[Editor<br/><i>pointer + pinch</i>]
        F[CardForm]
        R[ResultActions]
    end

    subgraph DOMAIN["⚙️  Domain  ·  pure + browser logic"]
        IM[image.ts<br/><i>EXIF · HEIC · downscale</i>]
        TR[transform.ts<br/><i>cover-fit · clamp</i>]
        TI[titles.ts<br/><i>deterministic titles</i>]
    end

    subgraph CANVAS["🎨  Canvas  ·  the product"]
        RN[render.ts<br/><i>drawPfp · drawCard · drawOg</i>]
        CK[canvasKit.ts<br/><i>arcText · grain · palm · barcode</i>]
        FO[fonts.ts<br/><i>FontFace registry</i>]
    end

    subgraph EDGE["🌐  Edge  ·  all optional"]
        SH[share.ts]
        AC["/api/cards<br/><i>Vercel Blob</i>"]
        AN["/api/counter<br/><i>Upstash INCR</i>"]
        CP["/c/[id]<br/><i>OG unfurl</i>"]
    end

    BR[["brand.ts — colours · strings · geometry<br/>THE SINGLE SWAP POINT"]]

    P --> U & E & F & R
    U --> IM
    E --> TR & RN
    F --> TI
    R --> RN & SH
    RN --> CK & FO & TR
    SH --> AC & AN
    AC --> CP
    BR -.-> RN
    BR -.-> CK
    BR -.-> SH
    BR -.-> CP

    classDef ui fill:#E23B22,stroke:#17130E,stroke-width:2px,color:#FFF3DC
    classDef dom fill:#2A6B3C,stroke:#17130E,stroke-width:2px,color:#FFF3DC
    classDef can fill:#1E4D2B,stroke:#F2B705,stroke-width:3px,color:#FFF3DC
    classDef edge fill:#14361E,stroke:#17130E,stroke-width:2px,color:#FFF3DC
    classDef brand fill:#F2B705,stroke:#17130E,stroke-width:3px,color:#17130E

    class P,U,E,F,R ui
    class IM,TR,TI dom
    class RN,CK,FO can
    class SH,AC,AN,CP edge
    class BR brand
```

### The intake pipeline

Portrait iPhone photos landing sideways is the single most common bug in tools like this. Three specific things prevent it:

```mermaid
flowchart LR
    A([File]) --> B{"> 15 MB?"}
    B -->|yes| X([friendly error])
    B -->|no| C["createImageBitmap<br/>imageOrientation: from-image"]
    C -->|ok| G
    C -->|throws| D{"ftyp box<br/>sniffs HEIC?"}
    D -->|no| E["retry bare<br/><i>old Safari</i>"]
    D -->|yes| H["⚡ dynamic import<br/>heic-to → JPEG q0.9"]
    H --> G
    E --> G["long edge > 2400?"]
    G -->|yes| I["halving downscale<br/><i>avoids aliasing</i>"]
    G -->|no| J([SourceImage])
    I --> J

    style H fill:#F2B705,stroke:#17130E,color:#17130E
    style X fill:#E23B22,stroke:#17130E,color:#FFF3DC
    style J fill:#1E4D2B,stroke:#F2B705,color:#FFF3DC
```

1. `imageOrientation: "from-image"` is what actually applies the EXIF rotation.
2. HEIC is detected by reading the **ftyp box bytes**, never the file extension — iOS hands out `.jpg`-named HEICs and empty MIME types.
3. `heic-to` is **dynamically imported**, so its ~3 MB WASM payload stays out of the main bundle. Most visitors upload a JPEG and never pay for it.

### Share — three independent routes

The task is judged on whether a post actually goes out, so no path is allowed to dead-end.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Canvas
    participant A as /api/cards
    participant B as Vercel Blob
    participant X as X

    U->>C: tap "Post on X"
    Note over C: window.open("") fires FIRST —<br/>Safari blocks popups opened after an await
    C->>C: render main 1080×1350 + og 1200×630
    C->>A: POST multipart (both PNGs)

    alt Blob configured
        A->>B: put cards/{id}/main.png + og.png
        B-->>A: absolute URLs
        A-->>C: { id, mainUrl, ogUrl }
        C->>X: intent/post?text=…%23FrameInGoa&url=/c/{id}
        X->>B: crawl og:image
        B-->>X: the actual card ✅
    else No token — 503, never a 500
        A-->>C: { error }
        C->>X: intent opens anyway, bare site URL
        Note over C,X: toast: "attach the image manually"
    end
```

| | Route | Shown when | Result |
|---|---|---|---|
| ① | **Web Share** | `navigator.canShare({files})` | Native sheet, X attaches the real PNG. Caption is copied to the clipboard *first* — several apps silently drop share `text` when a file rides along |
| ② | **Post on X** | always | Link unfurls the generated card via `/c/{id}` |
| ③ | **Download + Copy caption** | always | Works everywhere, offline included |

---

## Design decisions worth defending

<table>
<tr><td width="34%"><b>Preview and export share one code path</b></td><td>

`drawFormat(ctx, format, input)` always draws in **design space** — 1080×1080 or 1080×1350. The preview applies `ctx.scale()` first; the export doesn't. The preview therefore *cannot* drift from the PNG, and exports are full-resolution regardless of screen DPR.

</td></tr>
<tr><td><b>Fonts are self-hosted, not <code>next/font/google</code></b></td><td>

Canvas does not block on webfonts — if `fillText` runs before the face is ready the browser silently substitutes and the first export is quietly wrong. `lib/fonts.ts` registers each face via the `FontFace` API and every compositor `await`s `ensureFontsReady()`. Self-hosting also means the app builds and runs with **no network at all**.

Rozha One and Yatra One ship split Latin/Devanagari subsets, registered under one family name with `unicodeRange`, so `HACKER HOUSE गोवा` renders from a single `ctx.font`.

</td></tr>
<tr><td><b>Builder titles are fated, not random</b></td><td>

`titleFor(name)` is FNV-1a over an NFC-normalised, case-folded name, with a murmur3 finalizer decorrelating the adjective and role picks. The same name yields the same title on every device, forever — that is the delight. A 🎲 walks a salt forward until the words visibly change.

</td></tr>
<tr><td><b>The phone number is masked at the render boundary</b></td><td>

Not in the form, not on submit — in `maskPhone`, the only function the compositor is given. `CardFields.phone` holds the full value for the form's own use, but nothing between it and the canvas can print more than the last two digits. Making it a property of the render path rather than a validation rule means a future field row cannot accidentally reintroduce the leak.

</td></tr>
<tr><td><b>Zero required configuration</b></td><td>

Every env var is optional. No Blob token → `/api/cards` returns a clean **503** and the UI falls back to routes ① and ③. No KV → the builder number falls back to `(hash(name) % 247) + 1`, which is stable across reloads so a user who exports twice gets the same badge.

</td></tr>
</table>

---

## Verified, not assumed

Every number below came from driving the real app in headless Chromium against a production build.

```
  browser suite ······ 23/23   360px overflow · 44px targets · every field labelled
                               503-not-500 · 405 on GET · /c/[id] 404s bad ids
  phone masking ······ 13/13   swept every input length 3–15, no leak possible
  caption + titles ··· 25/25   #FrameInGoa invariant · determinism · slug fallbacks
  typecheck ·········· clean   strict + noUncheckedIndexedAccess
  taps to result ····· 2       (spec allowed 3)
  first load JS ······ 119 kB  WASM decoder confirmed split out
  export size ········ 1080×1350 verified byte-level on the downloaded PNG
```

Two of those are worth calling out because they are the ones that would be embarrassing to get wrong:

- **`grep` the exported PNG for the phone digits — they are not there.** Not the visible pixels, not the metadata. Asserted on the actual downloaded bytes, not on the input.
- **`#FrameInGoa` survives every caption branch**, including the truncation path and all 247 builder numbers. The submission is invalid without it, so it is a tested invariant rather than a string someone hopes stays put.

The caption that goes out with every post:

```
Locked in for Hacker House Goa 🌴 Builder #041/247 reporting.
Make yours → https://your-project.vercel.app #FrameInGoa @247pmstudio
```

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

No `.env` needed. See [`.env.example`](.env.example) for the optional extras.

## Deploy

Vercel, zero config. Optionally attach a Blob store to enable the unfurling share link, and set `NEXT_PUBLIC_BLOB_BASE_URL` to its public base.

## Brand assets

`public/brand/*.svg` are placeholders drawn in the matchbox style. Dropping the official HH Goa Brand Kit in with the same filenames is a zero-code swap; [`lib/brand.ts`](lib/brand.ts) is the only file holding colours, event strings and geometry.

<div align="center">
<br>
<sub><b>HACKER HOUSE गोवा</b> · GOA, INDIA · 28–31 OCT 2026 · <i>LESS NOISE. MORE SIGNAL</i></sub>
<br><br>
<sub>Demo photo is a generated placeholder illustration, not a real photograph.</sub>
</div>
