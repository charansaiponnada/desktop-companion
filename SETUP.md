# companion — setup guide

## prerequisites

### 1. Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 2. Tauri CLI prerequisites (Linux)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

macOS — just needs Xcode Command Line Tools:
```bash
xcode-select --install
```

Windows — install Microsoft C++ Build Tools and WebView2.

### 3. Node.js 20+
```bash
# via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
```

### 4. Ollama (optional — for AI-powered messages)
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.2    # ~2GB, runs locally
ollama serve            # starts on localhost:11434
```
Without Ollama, the companion uses built-in personality templates.

---

## running in dev

```bash
# 1. clone
git clone https://github.com/your-username/companion
cd companion

# 2. install JS deps
npm install

# 3. run (starts Vite dev server + Tauri shell)
npm run tauri:dev
```

The companion window appears in the bottom-right corner.
It's transparent and always-on-top — you can drag it anywhere.

---

## building a release binary

```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`
- macOS: `.dmg`
- Windows: `.msi`
- Linux: `.AppImage` or `.deb`

---

## adding a new avatar

1. Copy an existing avatar folder:
   ```bash
   cp -r src/avatars/cat src/avatars/dog
   ```

2. Edit `behaviors.json` — update id, name, personality strings.

3. Add a renderer function in `src/ui/Companion.jsx`:
   ```js
   function drawDog(ctx, state, frame, eyeX, eyeY) { ... }
   ```

4. Register it in the `AVATARS` and `RENDERERS` maps at the top of `Companion.jsx`.

5. Add the avatar button to `src/ui/Settings.jsx`.

That's it. No other changes needed.

---

## project structure

```
companion/
├── src/
│   ├── App.jsx                   entry point
│   ├── main.jsx                  React root
│   ├── core/
│   │   ├── stateMachine.js       event → state transitions
│   │   ├── inputMonitor.js       mouse/keyboard watcher
│   │   ├── pomodoro.js           focus timer
│   │   └── waterReminder.js      hydration nudges
│   ├── avatars/
│   │   ├── cat/behaviors.json    cat personality + transitions
│   │   └── fox/behaviors.json    fox personality + transitions
│   ├── ai/
│   │   ├── brain.js              Ollama wrapper + template fallback
│   │   └── summarizer.js         daily activity summarizer
│   ├── memory/
│   │   └── store.js              SQLite interface (via Tauri invoke)
│   └── ui/
│       ├── Companion.jsx         canvas renderer + wiring
│       └── Settings.jsx          settings panel
├── src-tauri/
│   ├── src/main.rs               Rust backend: window, DB commands
│   ├── Cargo.toml
│   └── tauri.conf.json           window config: transparent, always-on-top
├── index.html
├── vite.config.js
└── package.json
```

---

## what's next (v2 ideas)

- [ ] drag physics (squish on pickup, bounce on drop)
- [ ] cursor hunting (chase fast mouse moves across screen)
- [ ] active window detection (react to VS Code, browser, etc.)
- [ ] GitHub commit celebration (webhook or polling)
- [ ] plugin system (community avatars and integrations)
- [ ] sprite themes (dark mode cat, seasonal fox skins)
- [ ] AI prompt-based personality ("make it speak like a pirate")
