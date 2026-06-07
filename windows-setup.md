## Windows Setup for Companion

### Step 1 — Rust

Go to https://rustup.rs and download `rustup-init.exe`. Run it, choose option 1 (default install). When done, open a new terminal and verify:

```
rustc --version
```

### Step 2 — Microsoft C++ Build Tools

Download from https://visualstudio.microsoft.com/visual-cpp-build-tools

Run the installer, select "Desktop development with C++" workload. This is required for Rust to compile on Windows. Restart after install.

### Step 3 — WebView2

Check if you already have it — most Windows 11 machines do. Go to Settings → Apps and search "WebView2". If not there, download from:
https://developer.microsoft.com/en-us/microsoft-edge/webview2

### Step 4 — Node.js

Download the LTS installer from https://nodejs.org. Run it with default options. Verify:

```
node --version
npm --version
```

### Step 5 — Run the project

Extract the zip, open a terminal inside the `desktop-companion` folder, then:

```
npm install
npm run tauri:dev
```

First run will take 5–10 minutes — Cargo is downloading and compiling Rust dependencies. Subsequent runs are fast.

### Step 6 — Ollama (optional)

Download from https://ollama.com/download/windows. Install it, then open a terminal and run:

```
ollama pull llama3.2
```

That's about 2GB. Once pulled, Ollama runs automatically in the background on startup and the companion will use it for smarter messages. Without it everything still works — just uses the built-in personality templates.

### Common issues on Windows

**`linker 'link.exe' not found`** — C++ Build Tools not installed or terminal not restarted after install. Close and reopen terminal.

**`error: failed to run custom build command for 'webkit2gtk'`** — this error only happens on Linux. On Windows you should not see it.

**`EACCES` or permission errors on `npm install`** — run the terminal as Administrator, or move the project folder out of `C:\Program Files`.

**Transparent window not working** — requires Windows 10 build 1903 or later. On older Windows the window will have a white background instead of transparent, but everything else works.

**Port 1420 already in use** — something else is running on that port. Change `port: 1420` to `port: 1421` in `vite.config.js` and update `devPath` in `tauri.conf.json` to match.