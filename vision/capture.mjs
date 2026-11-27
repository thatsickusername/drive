import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(name, defaultValue = null) {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultValue;
}

let target = getArg('target', 'acceptance criteria 1');
// Sanitize target name for filename
const targetFileBase = target.replace(/[^a-zA-Z0-9_-]/g, '_');
const scenario = getArg('scenario', 'teleport_4');
let version = getArg('version');

if (!version) {
  // Find highest existing version
  const files = fs.readdirSync(screenshotsDir);
  const regex = new RegExp(`^${targetFileBase}_v(\\d+)\\.png$`);
  let maxV = 0;
  for (const f of files) {
    const m = f.match(regex);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v > maxV) maxV = v;
    }
  }
  version = maxV + 1;
}

const vName = `${targetFileBase}_v${version}.png`;
const latestName = `${targetFileBase}_latest.png`;
const outPathV = path.join(screenshotsDir, vName);
const outPathLatest = path.join(screenshotsDir, latestName);

// Check if Vite is running
function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureViteServer() {
  const url = 'http://localhost:5173';
  const isRunning = await checkServer(url);
  if (isRunning) {
    console.log('[vision] Vite dev server already running at', url);
    return null;
  }

  console.log('[vision] Starting Vite dev server...');
  const viteProcess = spawn('npx', ['vite', '--port', '5173'], {
    cwd: rootDir,
    shell: true,
    stdio: 'pipe'
  });

  // Wait for server to be responsive
  let started = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkServer(url)) {
      started = true;
      break;
    }
  }

  if (!started) {
    viteProcess.kill();
    throw new Error('Failed to start Vite dev server within 15 seconds.');
  }

  console.log('[vision] Vite dev server started successfully.');
  return viteProcess;
}

async function run() {
  let viteProcess = null;
  try {
    viteProcess = await ensureViteServer();

    console.log('[vision] Launching Playwright Chromium...');
    const browser = await chromium.launch({
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
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[browser error]', err));
    const isNight = target.includes('2') || scenario.includes('night') || getArg('lighting') === 'night';
    const isGolden = target.includes('3') || scenario.includes('golden') || getArg('lighting') === 'golden' || getArg('lighting') === 'goldenhour';
    const lightingQuery = isGolden ? '&lighting=golden' : (isNight ? '&lighting=night' : '');
    const navUrl = `http://localhost:5173?nohud=1&pause=1&perf=1${lightingQuery}`;
    console.log(`[vision] Navigating to ${navUrl}...`);
    await page.goto(navUrl, { waitUntil: 'networkidle' });

    await page.waitForSelector('#game-canvas', { timeout: 10000 });
    console.log('[vision] Canvas loaded. Waiting for 3D scene initialization...');
    await page.evaluate(({ isNight, isGolden }) => {
      const btn = document.getElementById('camera-tuner-toggle-btn');
      if (btn) btn.style.display = 'none';
      const hud = document.getElementById('hud');
      if (hud) hud.style.display = 'none';
      const toggle = document.getElementById('lighting-toggle-container');
      if (toggle) toggle.style.display = 'none';
      if (window.game) {
        window.game.renderer.cycle.isPaused = true;
        if (isGolden) {
          window.game.renderer.setLightingMode('golden', true);
        } else if (isNight) {
          window.game.renderer.setLightingMode('night', true);
        } else {
          window.game.renderer.setLightingMode('day', true);
        }
      }
    }, { isNight, isGolden });
    await page.waitForTimeout(1500);

    // Apply scenario
    if (target.includes('reference') || scenario.includes('reference')) {
      console.log('[vision] Executing scenario: Teleport to spawn 1 (Glacier Chute), accelerate with W, and carve left with A...');
      await page.keyboard.press('Digit1');
      await page.waitForTimeout(500);
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(1800);
      await page.keyboard.up('KeyW');
      await page.keyboard.down('KeyA');
      await page.waitForTimeout(1800);
      await page.keyboard.up('KeyA');
      await page.waitForTimeout(300);
    } else if (scenario === 'spray_slide' || scenario === 'spray_carve' || scenario === 'spray_low') {
      console.log(`[vision] Executing scenario: ${scenario}...`);
      if (scenario === 'spray_low') {
        // Low-speed gentle carve test on upper summit
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(1400);
        await page.keyboard.down('KeyA');
        await page.waitForTimeout(160);
      } else {
        // High-speed steep chute run (West Peak) before carving/sliding
        await page.keyboard.press('Digit2');
        await page.waitForTimeout(300);
        await page.keyboard.down('KeyW');
        await page.waitForTimeout(3600);
        await page.keyboard.up('KeyW');
        if (scenario === 'spray_slide') {
          await page.keyboard.down('ShiftLeft');
        }
        await page.keyboard.down('KeyA');
        await page.waitForTimeout(750);
      }
      const riderStats = await page.evaluate(() => {
        const p = window.game?.player;
        const sp = p?.snowSpray;
        let active = 0;
        let samplePos = null;
        let sampleAlpha = 0;
        let sampleSize = 0;
        if (sp) {
          let maxA = 0;
          let maxS = 0;
          for (let i = 0; i < sp.count; i++) {
            if (sp.lifetimes[i] > 0) {
              active++;
              if (sp.alphas[i] > maxA) maxA = sp.alphas[i];
              if (sp.sizes[i] > maxS) maxS = sp.sizes[i];
            }
          }
          const newestIdx = (sp.cursor - 1 + sp.count) % sp.count;
          samplePos = [
            Number(sp.positions[newestIdx * 3].toFixed(2)),
            Number(sp.positions[newestIdx * 3 + 1].toFixed(2)),
            Number(sp.positions[newestIdx * 3 + 2].toFixed(2))
          ];
          sampleAlpha = Number(maxA.toFixed(3));
          sampleSize = Number(maxS.toFixed(3));
        }
        return p ? {
          speed: Number(p.speed.toFixed(2)),
          leanAngle: Number(p.leanAngle.toFixed(2)),
          slipAngleDeg: Number(p.slipAngleDeg.toFixed(2)),
          isDrifting: p.isDrifting,
          isGrounded: p.isGrounded,
          rootPos: [Number(p.root.position.x.toFixed(2)), Number(p.root.position.y.toFixed(2)), Number(p.root.position.z.toFixed(2))],
          activeSpray: active,
          samplePos,
          sampleAlpha,
          sampleSize,
          inScene: !!sp?.points?.parent
        } : null;
      });
      console.log('[vision] Rider spray telemetry:', JSON.stringify(riderStats));
    } else if (scenario.includes('carve') || scenario.includes('steer')) {
      console.log('[vision] Executing scenario: Teleport to spawn 1 and hold carve steering...');
      await page.keyboard.press('Digit1');
      await page.waitForTimeout(1200);
      const key = scenario.includes('right') ? 'KeyD' : 'KeyA';
      console.log(`[vision] Holding ${key} for dynamic carving turn...`);
      await page.keyboard.down(key);
      const holdDuration = scenario.includes('plant') ? 350 : 1600;
      await page.waitForTimeout(holdDuration);
    } else if (scenario === 'perf_baseline' || scenario === 'summit_drop') {
      console.log('[vision] Executing scenario: Teleport to spawn 1 (Summit Drop) and sample 300 frames downhill...');
      await page.keyboard.press('Digit1');
      await page.waitForTimeout(500);
      await page.keyboard.down('KeyW');
      await page.waitForTimeout(5200);
      await page.keyboard.up('KeyW');
    } else if (scenario === 'teleport_4' || scenario.includes('4')) {
      console.log('[vision] Executing scenario: Teleport to spawn 4 (canyon) and slide down...');
      await page.keyboard.press('Digit4');
      // Wait for player to slide down slope 4
      await page.waitForTimeout(3000);
    } else if (target.includes('reference') || scenario.includes('reference')) {
      console.log('[vision] Executing scenario: Teleport to spawn 2 (West Peak) and shred downhill matching reference...');
      await page.keyboard.press('Digit2');
      await page.waitForTimeout(4000);
    } else if (scenario.includes('trail') || scenario.includes('acceptance')) {
      console.log('[vision] Executing scenario: Teleport to spawn 2 (West Peak) and carve right matching acceptance criteria...');
      await page.keyboard.press('Digit2');
      await page.waitForTimeout(1000);
      await page.keyboard.down('KeyD');
      await page.waitForTimeout(700);
      await page.keyboard.up('KeyD');
      await page.waitForTimeout(2400);
    } else if (scenario.startsWith('teleport_')) {
      const num = scenario.split('_')[1];
      console.log(`[vision] Executing scenario: Teleport to spawn ${num}...`);
      await page.keyboard.press(`Digit${num}`);
      await page.waitForTimeout(2500);
    } else {
      await page.waitForTimeout(2000);
    }

    // Extract performance telemetry if available
    const perfReport = await page.evaluate(() => {
      return (window.getPerfReport ? window.getPerfReport() : null);
    });
    if (perfReport) {
      console.log('[vision] Performance Telemetry Extracted:');
      console.log(`  - Cold Startup: WASM init: ${perfReport.startup.wasmInitMs}ms, Massif: ${perfReport.startup.massifBuildMs}ms, TTFF: ${perfReport.startup.timeToFirstFrameMs}ms`);
      console.log(`  - Pacing (ms): avg=${perfReport.frameTime.avg}, p50=${perfReport.frameTime.p50}, p95=${perfReport.frameTime.p95}, p99=${perfReport.frameTime.p99}, max=${perfReport.frameTime.max}`);
      console.log(`  - Physics Step (ms): avg=${perfReport.physicsStepTime.avg}, p95=${perfReport.physicsStepTime.p95}, max=${perfReport.physicsStepTime.max}`);
      console.log(`  - Render Time (ms): avg=${perfReport.renderTime.avg}, p95=${perfReport.renderTime.p95}, max=${perfReport.renderTime.max}`);
      console.log(`  - GPU: calls=${perfReport.gpuInfo.drawCalls}, tris=${perfReport.gpuInfo.triangles}, programs=${perfReport.gpuInfo.shaderPrograms}`);
      console.log(`  - Memory: heap=${perfReport.memory.latestHeapMB}MB (delta: ${perfReport.memory.heapDeltaMB}MB)`);
      const perfJsonPath = path.join(screenshotsDir, `${targetFileBase}_perf.json`);
      fs.writeFileSync(perfJsonPath, JSON.stringify(perfReport, null, 2));
    }

    console.log('[vision] Capturing screenshot...');
    await page.screenshot({ path: outPathV });
    fs.copyFileSync(outPathV, outPathLatest);

    console.log(`[vision] Capture saved:`);
    console.log(`  - ${outPathV}`);
    console.log(`  - ${outPathLatest}`);

    await browser.close();
  } catch (err) {
    console.error('[vision] Capture error:', err);
    process.exitCode = 1;
  } finally {
    if (viteProcess) {
      console.log('[vision] Terminating Vite dev server process...');
      viteProcess.kill();
    }
  }
}

run();
