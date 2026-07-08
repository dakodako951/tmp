const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded" });
  await page.click("#registerTab");
  await page.fill("#authNick", "MenuTester");
  await page.fill("#authEmail", `menu${Date.now()}@hero.local`);
  await page.fill("#authPassword", "secret123");
  await page.click("#authSubmit");
  await page.waitForSelector("#menu.active", { timeout: 5000 });
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const logo = document.querySelector(".main-logo").getBoundingClientRect();
    const roster = document.querySelector(".roster-panel").getBoundingClientRect();
    const cards = [...document.querySelectorAll(".hero-card")].filter((card) => {
      const rect = card.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }).length;
    return { logoTop: logo.top, logoWidth: logo.width, rosterTop: roster.top, visibleHeroCards: cards };
  });
  await page.screenshot({ path: "menu-layout-check.png", fullPage: false });
  await browser.close();
  console.log(JSON.stringify({ info, errors }, null, 2));
  if (errors.length || info.visibleHeroCards < 3 || info.logoTop > 40 || info.logoWidth < 360) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
