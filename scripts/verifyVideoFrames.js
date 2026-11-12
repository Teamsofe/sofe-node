const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function checkVideo() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080']
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  const videoPath = 'http://localhost:3000/videos/sofe_ai_tutor_demo.webm';
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; background: black;">
        <video id="vid" src="${videoPath}" style="width: 1920px; height: 1080px;" controls muted></video>
      </body>
    </html>
  `);

  await page.waitForTimeout(1000);

  const times = [5, 25, 55, 85, 110];
  const outDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\76387a38-17b7-4178-b226-3aae639acecb';

  for (const t of times) {
    await page.evaluate(async (time) => {
      const v = document.getElementById('vid');
      v.currentTime = time;
      await new Promise(r => {
        v.onseeked = () => r();
        setTimeout(r, 2000);
      });
    }, t);

    await page.waitForTimeout(500);
    const snapPath = path.join(outDir, `frame_${t}s.png`);
    await page.screenshot({ path: snapPath });
    console.log(`Captured frame at ${t}s to ${snapPath}`);
  }

  await browser.close();
}

checkVideo().catch(console.error);
