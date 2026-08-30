// DeepSeek Harness desktop wrapper.
// Auto-starts `dsh web`, waits until the local server is ready, opens an Electron
// window on it, and kills the background dsh process tree when the window closes.
const { app, BrowserWindow } = require("electron");
const { spawn, exec } = require("child_process");
const http = require("http");

const DSH_PORT = process.env.DSH_PORT || "3080";
const DSH_URL = `http://127.0.0.1:${DSH_PORT}`;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

let dshChild = null;
let mainWindow = null;

function startDsh() {
  const isWin = process.platform === "win32";
  // Windows needs the shell so the dsh.cmd shim resolves; on POSIX the wrapper
  // shell would mask the real process, so spawn directly and take a new
  // process group we can kill wholesale.
  dshChild = spawn("dsh", ["web"], {
    shell: isWin,
    detached: !isWin,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: DSH_PORT },
  });
  dshChild.stdout.on("data", (d) => process.stdout.write(`[dsh] ${d}`));
  dshChild.stderr.on("data", (d) => process.stderr.write(`[dsh] ${d}`));
  dshChild.on("exit", (code) => {
    process.stdout.write(`[dsh] exited with code ${code}\n`);
    dshChild = null;
  });
  dshChild.on("error", (err) => {
    process.stderr.write(`[dsh] failed to start: ${err.message} (is the dsh CLI on PATH?)\n`);
    dshChild = null;
  });
}

function waitForReady() {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = http.get(DSH_URL, (res) => {
        res.resume();
        resolve(true);
      });
      req.on("error", () => {
        if (Date.now() - startedAt > READY_TIMEOUT_MS) {
          reject(new Error(`dsh web not ready at ${DSH_URL} within ${READY_TIMEOUT_MS}ms`));
        } else {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      });
      req.setTimeout(1000, () => req.destroy());
    };
    poll();
  });
}

function killDsh() {
  if (!dshChild) return;
  try {
    if (process.platform === "win32" && dshChild.pid) {
      // Kill the process tree so no orphan dsh/node remains.
      exec(`taskkill /pid ${dshChild.pid} /T /F`, () => {});
    } else if (dshChild.pid) {
      const pid = dshChild.pid;
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        dshChild.kill("SIGTERM");
      }
      const escalate = setTimeout(() => {
        try { process.kill(-pid, "SIGKILL"); } catch { /* already gone */ }
      }, 3000);
      escalate.unref();
    }
  } catch {
    // ignore
  }
  dshChild = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    title: "DeepSeek Harness",
    autoHideMenuBar: true,
  });
  mainWindow.loadURL(DSH_URL);
  mainWindow.on("closed", () => {
    mainWindow = null;
    killDsh();
    app.quit();
  });
}

app.whenReady().then(async () => {
  startDsh();
  try {
    await waitForReady();
  } catch (err) {
    process.stderr.write(`${err}\n`);
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  killDsh();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => killDsh());
