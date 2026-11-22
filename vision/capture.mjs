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
    console.log('[vision] Navigating to http://localhost:5173?nohud=1...');
    await page.goto('http://localhost:5173?nohud=1', { waitUntil: 'networkidle' });

    await page.waitForSelector('#game-canvas', { timeout: 10000 });
    console.log('[vision] Canvas loaded. Waiting for 3D scene initialization...');
    await page.evaluate(() => {
      const btn = document.getElementById('camera-tuner-toggle-btn');
      if (btn) btn.style.display = 'none';
      const hud = document.getElementById('hud');
      if (hud) hud.style.display = 'none';
    });
    await page.waitForTimeout(1500);

    // Apply scenario
    if (scenario === 'teleport_4' || scenario.includes('4')) {
      console.log('[vision] Executing scenario: Teleport to spawn 4 (canyon)...');
      await page.keyboard.press('Digit4');
      // Allow skier to drop/glide slightly forward as seen in reference image
      await page.waitForTimeout(2500);
    } else if (scenario.startsWith('teleport_')) {
      const num = scenario.split('_')[1];
      console.log(`[vision] Executing scenario: Teleport to spawn ${num}...`);
      await page.keyboard.press(`Digit${num}`);
      await page.waitForTimeout(2500);
    } else {
      await page.waitForTimeout(2000);
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
