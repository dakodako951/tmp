const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded" });
  await page.click("#registerTab");
  await page.fill("#authNick", "BrowserTester");
  await page.fill("#authEmail", `browser${Date.now()}@hero.local`);
  await page.fill("#authPassword", "secret123");
  await page.click("#authSubmit");
  await page.waitForSelector("#menu.active", { timeout: 5000 });
  await page.click("#playButton");
  await page.waitForSelector("#game.active", { timeout: 5000 });
  await page.waitForTimeout(1000);
  const activeGame = await page.$eval("#game", (el) => el.classList.contains("active"));
  await page.screenshot({ path: "auth-game-check.png", fullPage: false });
  await browser.close();
  console.log(JSON.stringify({ activeGame, errors }, null, 2));
  if (!activeGame || errors.length) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
