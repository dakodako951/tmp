const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const results = [];

  for (const viewport of [
    { width: 1280, height: 720, label: "desktop" },
    { width: 390, height: 844, label: "mobile" }
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("http://127.0.0.1:5173/", { waitUntil: "domcontentloaded" });
    await page.click("#registerTab");
    await page.fill("#authNick", `ThreeD${viewport.label}`);
    await page.fill("#authEmail", `3d-${viewport.label}-${Date.now()}@hero.local`);
    await page.fill("#authPassword", "secret123");
    await page.click("#authSubmit");
    await page.waitForSelector("#menu.active", { timeout: 5000 });
    await page.click("#playButton");
    await page.waitForTimeout(2500);

    const sample = await page.evaluate(() => {
      const canvas = document.querySelector("#gameCanvas");
      const rect = canvas.getBoundingClientRect();

      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        cssWidth: rect.width,
        cssHeight: rect.height,
        dataUrlLength: canvas.toDataURL("image/png").length,
        activeGame: document.querySelector("#game").classList.contains("active")
      };
    });

    const screenshot = await page.screenshot({ path: `3d-check-${viewport.label}.png`, fullPage: false });
    sample.screenshotByteDiversity = new Set(screenshot).size;
    results.push({ viewport: viewport.label, sample, errors });
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
