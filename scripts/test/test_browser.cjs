const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to http://localhost:3000');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 20000 });
  } catch (e) {
    console.log('Goto error:', e.message);
  }
  
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'C:/Users/musta/.gemini/antigravity-ide/brain/842429ef-6ba8-4e50-90a1-1b0bdae55185/screenshot.png' });
  console.log('Screenshot saved');
  
  await browser.close();
})();
