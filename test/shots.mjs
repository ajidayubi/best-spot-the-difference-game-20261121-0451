// Screenshot + play driver for Lantern Harbour.
//
// Serves game/ on :8080, drives the cached headless Chrome over CDP,
// captures the four staged shots from shots.json at 1280x720, then
// plays a real click on the live game (no ?shot) and checks the HUD
// moves: a click on a difference marks it found, a click on empty
// water counts a miss.
//
// Run: node test/shots.mjs (paths resolve from this file). Requires the
// Chromium binary from the Playwright cache.
import { spawn, execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const CHROME = join(
  process.env.HOME ?? '',
  '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
);
const PORT = 8091;
const CDP_PORT = 9333;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

async function main() {
  const failures = [];
  const check = (name, ok, extra) => {
    console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra !== undefined ? ' — ' + extra : ''));
    if (!ok) failures.push(name);
  };

  if (!existsSync(CHROME)) {
    console.log('FAIL no Chrome binary at ' + CHROME);
    process.exit(1);
  }

  // Serve game/.
  const server = spawn(process.execPath, [join(repo, 'serve.ts')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  server.stdout.on('data', (d) => (serverLog += d));
  server.stderr.on('data', (d) => (serverLog += d));

  // Launch headless Chrome with a CDP port.
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1280,720',
    `--remote-debugging-port=${CDP_PORT}`,
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let chromeLog = '';
  chrome.stderr.on('data', (d) => (chromeLog += d));

  try {
    // Wait for the server and the browser.
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}/index.html`);
        if (r.ok) break;
      } catch { /* not up yet */ }
      await sleep(250);
    }
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
        if (targets && targets.length > 0) break;
      } catch { /* not up yet */ }
      await sleep(250);
    }
    if (!targets || targets.length === 0) throw new Error('CDP targets never appeared');
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    let msgId = 0;
    const pending = new Map();
    const consoleErrors = [];
    const exceptions = [];
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 400));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        consoleErrors.push(JSON.stringify(msg.params.args).slice(0, 400));
      }
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

    const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8')).shots;
    for (const shot of shots) {
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${shot.query}` });
      await sleep(1500);
      const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
      const buf = Buffer.from(data, 'base64');
      const out = join(repo, shot.file);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, buf);
      check(
        shot.name + ' screenshot written ≤256 KiB',
        buf.length <= 262144,
        `${(buf.length / 1024).toFixed(1)} KiB`,
      );
    }

    // Live play test: no ?shot — start the game, click the sun
    // difference on the left panel, then click empty water.
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(1200);
    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 500));
      return r.result.value;
    };
    await evalJs(`document.getElementById('btn-start').click()`);
    await sleep(400);
    const before = await evalJs(`document.getElementById('hud-found').textContent`);
    check('HUD shows 0/7 before any click', before.includes('0 / 7'), before);
    // The sun sits at panel (468,108); the left canvas starts at x=20
    // in the 1280 layout, y≈150. Click its centre via element coords.
    await evalJs(`
      (() => {
        const c = document.getElementById('panel-left');
        const r = c.getBoundingClientRect();
        const x = r.left + (468 / 600) * r.width;
        const y = r.top + (108 / 440) * r.height;
        c.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
        return true;
      })()
    `);
    await sleep(400);
    const afterFound = await evalJs(`document.getElementById('hud-found').textContent`);
    check('click on the sun marks 1/7 found', afterFound.includes('1 / 7'), afterFound);
    const remaining = await evalJs(`document.getElementById('hud-remaining').textContent`);
    check('counter drops to 6 remaining', remaining.includes('6 remaining'), remaining);
    await evalJs(`
      (() => {
        const c = document.getElementById('panel-right');
        const r = c.getBoundingClientRect();
        const x = r.left + (300 / 600) * r.width;
        const y = r.top + (420 / 440) * r.height;
        c.dispatchEvent(new MouseEvent('click', { clientX: x, clientY: y, bubbles: true }));
        return true;
      })()
    `);
    await sleep(400);
    const misses = await evalJs(`document.getElementById('hud-mistakes').textContent`);
    check('click on empty water counts a miss', misses.includes('Misses: 1'), misses || '(empty)');

    check('no page exceptions during play', exceptions.length === 0, exceptions.join(' | '));
    check('no console errors during play', consoleErrors.length === 0, consoleErrors.join(' | '));
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.kill('SIGKILL');
  }

  console.log(failures.length === 0 ? '\nALL SHOT CHECKS PASSED' : `\n${failures.length} SHOT CHECK(S) FAILED`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('shots driver failed:', e);
  process.exit(1);
});
