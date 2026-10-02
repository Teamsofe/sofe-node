const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  
  await page.waitForSelector('nav');

  const navInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const rect = nav.getBoundingClientRect();
    const style = window.getComputedStyle(nav);
    
    const bodyRect = document.body.getBoundingClientRect();
    const sidebar = document.querySelector('.dash-desktop-sidebar');
    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;

    return {
      nav: {
        rect: rect.toJSON(),
        left: style.left,
        width: style.width,
        maxWidth: style.maxWidth,
        transform: style.transform
      },
      sidebar: sidebarRect ? sidebarRect.toJSON() : null,
      body: {
        rect: bodyRect.toJSON()
      },
      window: { innerWidth: window.innerWidth }
    };
  });

  console.log(JSON.stringify(navInfo, null, 2));
  await browser.close();
})();
