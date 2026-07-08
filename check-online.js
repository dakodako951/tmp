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
  await page.fill("#authNick", "OnlineTester");
  await page.fill("#authEmail", `online${Date.now()}@hero.local`);
  await page.fill("#authPassword", "secret123");
  await page.click("#authSubmit");
  await page.waitForSelector("#menu.active", { timeout: 5000 });
  await page.click("#quickMatchButton");
  await page.waitForSelector("#game.active", { timeout: 5000 });
  await page.waitForTimeout(1200);
  const data = await page.evaluate(() => ({
    activeGame: document.querySelector("#game").classList.contains("active"),
    status: document.querySelector("#onlineStatus").textContent
  }));
  await page.screenshot({ path: "online-check.png", fullPage: false });
  await browser.close();
  console.log(JSON.stringify({ ...data, errors }, null, 2));
  if (!data.activeGame || errors.length) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
