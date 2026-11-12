const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  console.log('Navigating to http://localhost:3000/course-view?course=foundation&demo=true...');
  await page.goto('http://localhost:3000/course-view?course=foundation&demo=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  console.log('Waiting 5s for React render...');
  await page.waitForTimeout(5000);
  
  const screenshotPath = path.join(__dirname, '../public/test_screen.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  const text = await page.content();
  const hasLoading = text.includes('Loading learning experience');
  console.log('Has "Loading learning experience"?', hasLoading);

  const hasTutor = text.includes('Sofe AI Tutor');
  console.log('Has "Sofe AI Tutor"?', hasTutor);

  await browser.close();
})();
