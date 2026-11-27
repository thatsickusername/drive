import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const PORT = 3011;
const BASE_URL = `http://localhost:${PORT}`;

function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startProdServer() {
  const proc = spawn(process.execPath, ['server/index.js'], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await checkServer(BASE_URL)) {
      return proc;
    }
  }
  proc.kill();
  throw new Error(`Production server failed to start on ${BASE_URL}`);
}

async function run() {
  const serverProc = await startProdServer();
  let browser;
  const pageErrors = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--use-gl=angle',
        '--use-angle=d3d11',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Workerized startup & main-thread massifBuildMs < 100ms on production dist/
    await page.goto(`${BASE_URL}/?perf=1&pause=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => Boolean(window.game && window.game.massif && !document.getElementById('boot-overlay')),
      { timeout: 20000 }
    );
    await page.waitForTimeout(500);

    const startupReport = await page.evaluate(() => window.getPerfReport());
    assert.ok(startupReport, 'Expected PerfReport from ?perf=1');
    assert.ok(
      startupReport.startup.massifBuildMs < 100,
      `Expected main-thread massifBuildMs < 100ms, got ${startupReport.startup.massifBuildMs}ms`
    );
    assert.ok(startupReport.framesSampled > 5, 'Expected rendered frames');
    console.log(
      `[PASS] Production startup: massifBuildMs=${startupReport.startup.massifBuildMs}ms, TTFF=${startupReport.startup.timeToFirstFrameMs}ms, frames=${startupReport.framesSampled}`
    );

    // 2. window.blur during active key holds clears steering/key state
    await page.keyboard.down('KeyA');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(200);
    const preBlur = await page.evaluate(() => {
      const ic = window.game.inputController;
      ic.getBoarderInputs();
      return {
        keys: Object.keys(ic.keyState || {}).length,
        steer: ic.keyboardSteer
      };
    });
    assert.ok(preBlur.keys > 0, 'Expected active keyState before blur');

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.waitForTimeout(100);
    const postBlur = await page.evaluate(() => {
      const ic = window.game.inputController;
      return {
        keys: Object.keys(ic.keyState || {}).length,
        steer: ic.keyboardSteer
      };
    });
    await page.keyboard.up('KeyA');
    await page.keyboard.up('KeyW');
    assert.equal(postBlur.keys, 0, 'Expected keyState cleared on window.blur');
    assert.equal(postBlur.steer, 0, 'Expected keyboardSteer reset to 0 on window.blur');
    console.log('[PASS] window.blur cleared active keyState and steering');

    // 3. Quality tier switching (Low -> High)
    const lowStats = await page.evaluate(() => {
      window.game.setQualityTier('low');
      const r = window.game.renderer;
      return {
        shadowSize: r.dirLight.shadow.mapSize.width,
        dpr: r.renderer.getPixelRatio(),
        fillVisible: r.fillLight.visible,
        noBlur: document.body.classList.contains('no-backdrop-blur')
      };
    });
    assert.equal(lowStats.shadowSize, 1024);
    assert.ok(lowStats.dpr <= 1.0);
    assert.equal(lowStats.fillVisible, false);
    assert.equal(lowStats.noBlur, true);

    const highStats = await page.evaluate(() => {
      window.game.setQualityTier('high');
      const r = window.game.renderer;
      return {
        shadowSize: r.dirLight.shadow.mapSize.width,
        fillVisible: r.fillLight.visible,
        noBlur: document.body.classList.contains('no-backdrop-blur')
      };
    });
    assert.equal(highStats.shadowSize, 2048);
    assert.equal(highStats.fillVisible, true);
    assert.equal(highStats.noBlur, false);
    console.log('[PASS] Quality tier switching verified (Low <-> High)');

    // 4. WEBGL_lose_context loseContext() / restoreContext() recovery
    const lost = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const ext = gl?.getExtension('WEBGL_lose_context');
      if (!ext) return false;
      window.__testLoseExt = ext;
      ext.loseContext();
      return true;
    });
    assert.ok(lost, 'Expected WEBGL_lose_context extension in Chromium');
    await page.waitForFunction(() => window.game.renderer.isContextLost === true, { timeout: 5000 });
    const bannerVisible = await page.evaluate(() => {
      const el = document.getElementById('webgl-context-lost-banner');
      return Boolean(el && el.style.display !== 'none');
    });
    assert.ok(bannerVisible, 'Expected context-lost banner visible');

    const framesBeforeRestore = await page.evaluate(() => window.getPerfReport().framesSampled);
    await page.evaluate(() => window.__testLoseExt.restoreContext());
    await page.waitForFunction(() => window.game.renderer.isContextLost === false, { timeout: 10000 });
    await page.waitForTimeout(400);
    const framesAfterRestore = await page.evaluate(() => window.getPerfReport().framesSampled);
    assert.ok(
      framesAfterRestore > framesBeforeRestore,
      `Expected rendering to resume after restoreContext (${framesBeforeRestore} -> ${framesAfterRestore})`
    );
    console.log(`[PASS] WEBGL_lose_context recovered (${framesBeforeRestore} -> ${framesAfterRestore} frames)`);

    // 5. Game.dispose() clean teardown
    const teardown = await page.evaluate(() => {
      window.game.dispose();
      return {
        gameGlobal: window.game,
        hud: document.getElementById('hud'),
        lighting: document.getElementById('lighting-toggle-container'),
        tunerBtn: document.getElementById('camera-tuner-toggle-btn'),
        tunerPanel: document.getElementById('camera-tuner-panel'),
        boot: document.getElementById('boot-overlay'),
        lostBanner: document.getElementById('webgl-context-lost-banner')
      };
    });
    assert.equal(teardown.gameGlobal, null);
    assert.equal(teardown.hud, null);
    assert.equal(teardown.lighting, null);
    assert.equal(teardown.tunerBtn, null);
    assert.equal(teardown.tunerPanel, null);
    assert.equal(teardown.boot, null);
    assert.equal(teardown.lostBanner, null);
    assert.equal(pageErrors.length, 0, `Unexpected pageerrors: ${pageErrors.join('; ')}`);
    console.log('[PASS] Game.dispose() cleanly removed all DOM overlays and loops (0 page errors)');
  } finally {
    if (browser) await browser.close();
    serverProc.kill();
  }
}

run().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
