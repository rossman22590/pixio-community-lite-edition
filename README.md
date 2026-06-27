<p align="center">
  <img src="https://pixiomedia.nyc3.digitaloceanspaces.com/uploads/1782546670680-823e0743-3ff2-4252-98d9-6f45c5bd00b8.png" alt="Pixio Studio" width="100%" />
</p>

<h1 align="center">Pixio Studio</h1>

<p align="center">
  <strong>The open-source AI media studio.</strong><br/>
  Generate, edit, and orchestrate images & video across three connected surfaces —
  a fast <em>Studio</em>, a Canva-style <em>AI Canvas</em>, and a ComfyUI-style <em>Node graph</em> —
  all powered by your own <a href="https://prodia.com">Prodia</a> key.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-13-black?logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-18-149eca?logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" />
  <img alt="Prodia" src="https://img.shields.io/badge/Prodia-v2%20API-ff4ecb" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-8b5cf6" />
</p>

---

## ✨ Three surfaces, one creative flow

| | Surface | What it's for |
|---|---|---|
| ⚡ | **Studio** | The fast lane. Fire any image/video models in parallel, compare outputs side-by-side, iterate at speed. |
| 🎨 | **Canvas** | An infinite Canva-style board. Drop or generate images, then **click any image to edit it with AI** — instruction edits, inpaint, remove-bg, upscale, variations. |
| 🕸️ | **Nodes** | A visual workflow graph. Wire **Prompt → Generate → Edit → Output**, chain an image into an edit model, run the whole pipeline. |

Everything **flows between them**: generate in Studio → *Send to Canvas* to edit → drop the result into a *Node* pipeline. Your gallery is shared across all three and **persists across reloads** (IndexedDB).

---

## 🚀 Highlights

- **🔁 Universal remix bar** — on every output: Vary · Edit · Upscale · Remove BG · Animate → video · Send to Canvas/Nodes · Compare · Download.
- **🖌️ Click-to-edit canvas** — select an image, type an instruction, pick an edit model (FLUX Kontext, Qwen Image-Edit, Seedream) and apply — or mask-brush to inpaint.
- **🧩 Real node engine** — typed, color-coded ports, connection validation, drag-to-empty quick-add, save/load/export graphs, topological execution with live per-node status + cost.
- **⌘ Command palette** — `⌘K` to jump anywhere, run anything, pick any of 45 models, or paste a recent prompt.
- **⏳ Alive waiting** — a queue dock with live timers and a completion chime; keep creating while jobs run.
- **🆚 Compare view** — tag outputs and A/B them with a draggable before/after slider, or grid up to four.
- **🎨 20 accent themes + light/dark** — a Settings menu recolors the *entire* app live; your two chosen colors take over everywhere.
- **💸 Exact cost tracking** — per-job Prodia pricing via `?price=true`.
- **🔐 Bring-your-own-key** — your Prodia key lives only in your browser.
- **⌨️ Keyboard-first**, drag-and-drop image import, prompt + model memory, `prefers-reduced-motion` aware.

---

## 🤖 Powered by Prodia

Pixio talks to the **Prodia v2 inference API** (`POST https://inference.prodia.com/v2/job`). Image-input jobs are sent as `multipart/form-data` (a `job` part + binary `input` parts), so editing and chaining work end-to-end.

**Operations:** `txt2img` · `img2img` · instruction `edit` · `inpaint` · `upscale` · `remove-background` · `txt2vid` · `img2vid`

**Model families:** FLUX & FLUX 2 · FLUX Kontext · Google Gemini / Nano Banana · Stable Diffusion (SDXL / SD1.5) · ByteDance Seedream · Recraft · Qwen Image-Edit · Google Veo · Wan · Kling · Sora 2 · Pruna · HYPIR upscaler

---

## 🏁 Quick start

```bash
git clone https://github.com/rossman22590/pixio-community-lite-edition.git
cd pixio-community-lite-edition
npm install
cp .env.example .env   # optional — the app also takes your key in the UI
npm run dev            # → http://localhost:3000
```

Open the app, paste your free **Prodia API key** (grab one at [app.prodia.com](https://app.prodia.com)), and start creating.

---

## 🔑 Environment

All optional — the app is fully usable with just an in-browser key.

| Variable | Purpose |
|---|---|
| `PRODIA_KEY` | Server-side fallback key (used only when a request has none). |
| `OPENAI_API_KEY` | Enables AI **prompt remix** + **image → prompt**. Falls back to strong local heuristics if absent. |
| `OPENAI_MODEL` / `OPENAI_VISION_MODEL` | Override the model used for the AI helpers. |

---

## ⌨️ Keyboard shortcuts

| Key | Action |
|---|---|
| `⌘K` | Command palette |
| `⌘↵` | Generate |
| `?` | Shortcuts cheat-sheet |
| `⌘\` | Toggle theme |
| `G` / `C` / `N` | Studio / Canvas / Nodes |
| `Esc` | Close overlays |

---

## 🧱 Architecture

```
lib/
  prodia/      catalog · config builder · client · types   (operation-aware model registry)
  graph/       registry · zustand store · execution engine (the node system)
  canvas/      element model · geometry · mask · image hook
  studio/      global store (+ IndexedDB) · theme/accents · useGenerate · useRemix
components/studio/
  Sidebar · RegularSurface · Inspector · RemixBar · CommandPalette ·
  QueueDock · CompareView · SettingsMenu · ApiKeyModal
  nodes/       NodeStudio · NodeTypes · shared        (React Flow)
  canvas/      CanvasStudio · AIPopover · MaskToolbar · PropertiesPanel · …  (Konva)
pages/
  index.tsx    thin orchestrator (shell + 3 surfaces)
  api/         job (unified, multipart) · assist · vision
```

---

## 🧰 Tech stack

**Next.js 13** (Pages Router) · **React 18** · **TypeScript** · **Zustand** · **@xyflow/react** (React Flow) · **Konva / react-konva** · **lucide-react** · CSS-variable design system (Inter + Space Grotesk).

---

## 📄 License

MIT — see [LICENSE](./LICENSE). Build something amazing.

<p align="center"><sub>Made with 💜 by the Pixio community · try the full platform at <a href="https://beta.pixio.myapps.ai">beta.pixio.myapps.ai</a></sub></p>
