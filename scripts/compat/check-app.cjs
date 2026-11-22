// Serves an app built by make-app.sh and draws two strokes on it in a real browser.
// Fails unless the canvas has the configured size, both strokes are recorded,
// the legacy output fired for each, and the page logged no errors.
//
// Usage: node scripts/compat/check-app.cjs <app-dist-dir> [port]
// Env:   PLAYWRIGHT_DIR   directory whose node_modules contains playwright (default: cwd)
//        BROWSER_CHANNEL  e.g. "chrome" to use installed Google Chrome (default: bundled Chromium)
const http = require('http');
const fs = require('fs');
const path = require('path');

const { chromium } = require(require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_DIR || process.cwd()] }));
const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3] || 4600);
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css' };

const server = http
  .createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, 'index.html');
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port);

(async () => {
  const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(`http://localhost:${port}/`);
  const canvas = page.locator('signature-pad canvas');
  await canvas.waitFor({ timeout: 15000 });
  const box = await canvas.boundingBox();
  const size = await canvas.evaluate((c) => `${c.width}x${c.height}`);
  for (const [y1, y2] of [[50, 120], [140, 60]]) {
    await page.mouse.move(box.x + 30, box.y + y1);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + y2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(150);
  }
  const status = (await page.locator('#status').textContent()).trim();
  const ok = size === '400x200' && status === 'strokes=2 legacy=2 empty=false' && errors.length === 0;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} (${browser.browserType().name()} ${browser.version()}): canvas ${size}, ${status}, ` +
      `errors: ${errors.length ? errors.join(' | ') : 'none'}`,
  );
  await browser.close();
  server.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
