const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.goto('http://localhost:3000/course-view?course=foundation&demo=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  // Click Sofe AI Tutor tab in desktop sidebar
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.cv-desktop-sidebar .cv-tab-btn'));
    const tutorBtn = btns.find(b => b.innerText.includes('Tutor'));
    if (tutorBtn) {
      tutorBtn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked Sofe AI Tutor via DOM evaluate:', clicked);
  
  await page.waitForTimeout(3000);
  const screenshotPath = path.join(__dirname, '../public/tutor_opened.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);
  
  const text = await page.content();
  console.log('Has muse-spark-1.3?', text.includes('muse-spark-1.3'));
  console.log('Has Ask tab?', text.includes('Ask'));

  await browser.close();
})();
