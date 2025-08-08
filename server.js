import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

let browser;
let page;

async function getPage() {
  if (!browser) {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new"
    });
  }
  if (!page) {
    const ctx = await browser.createIncognitoBrowserContext();
    page = await ctx.newPage();
    await page.setBypassCSP(true);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );
  }
  return page;
}

app.post("/open", async (req, res) => {
  try {
    const { url, wait = "networkidle0" } = req.body;
    const p = await getPage();
    await p.goto(url, { waitUntil: wait, timeout: 45000 });
    const title = await p.title();
    res.json({ url: p.url(), title });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/text", async (req, res) => {
  try {
    const { selector } = req.body;
    const p = await getPage();
    await p.waitForSelector(selector, { timeout: 8000 });
    const text = await p.$eval(selector, el => el.innerText);
    res.json({ text });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/click", async (req, res) => {
  try {
    const { selector } = req.body;
    const p = await getPage();
    await p.waitForSelector(selector, { timeout: 8000 });
    await p.click(selector);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/type", async (req, res) => {
  try {
    const { selector, text } = req.body;
    const p = await getPage();
    await p.waitForSelector(selector, { timeout: 8000 });
    await p.focus(selector);
    await p.click(selector, { clickCount: 3 });
    await p.type(selector, text ?? "");
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/shot", async (req, res) => {
  try {
    const p = await getPage();
    const path = `screenshots_${Date.now()}.png`;
    await p.screenshot({ path, fullPage: true });
    res.json({ path });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log("WebOps Mini (Puppeteer) listening on " + port));
