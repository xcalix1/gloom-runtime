import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

let browser;
let page;

async function getPage() {
  if (!browser) browser = await chromium.launch({ headless: true });
  if (!page) {
    const ctx = await browser.newContext();
    page = await ctx.newPage();
  }
  return page;
}

app.post("/open", async (req, res) => {
  try {
    const { url, wait = "networkidle" } = req.body;
    const p = await getPage();
    await p.goto(url, { waitUntil: wait });
    const title = await p.title();
    res.json({ url: p.url(), title });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/text", async (req, res) => {
  try {
    const { selector } = req.body;
    const p = await getPage();
    await p.waitForSelector(selector, { timeout: 8000 });
    const text = await p.locator(selector).innerText();
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/click", async (req, res) => {
  try {
    const { selector } = req.body;
    const p = await getPage();
    await p.waitForSelector(selector, { timeout: 8000 });
    await p.click(selector);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/type", async (req, res) => {
  try {
    const { selector, text } = req.body;
    const p = await getPage();
    await p.waitForSelector(selector, { timeout: 8000 });
    await p.fill(selector, text ?? "");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/shot", async (req, res) => {
  try {
    const p = await getPage();
    const path = `screenshots_${Date.now()}.png`;
    await p.screenshot({ path, fullPage: true });
    res.json({ path });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log("WebOps Mini listening on " + port));
