const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SRC_DIR = "C:\\Users\\ronak\\Downloads\\PredictionFile";
const OUT_DIR = path.join(__dirname, "..", "private-assets", "prediction-files");

const FILES = [
  { src: "ASQ.html", out: "Answer-Short-Question.pdf" },
  { src: "DI.html", out: "Describe-Image.pdf" },
  { src: "FIB.html", out: "Fill-in-the-Blanks.pdf" },
  { src: "RS.html", out: "Repeat-Sentence.pdf" },
  { src: "RTS.html", out: "Responding-to-Situation.pdf" },
  { src: "SST.html", out: "Summarize-Spoken-Text.pdf" },
  { src: "WE.html", out: "Write-an-Email.pdf" },
  { src: "WFD.html", out: "Write-from-Dictation.pdf" },
];

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  for (const f of FILES) {
    const srcPath = path.join(SRC_DIR, f.src);
    const outPath = path.join(OUT_DIR, f.out);
    console.log(`Rendering ${f.src} -> ${f.out}`);
    const page = await browser.newPage();
    await page.goto("file://" + srcPath.replace(/\\/g, "/"), { waitUntil: "load", timeout: 120000 });
    await page.pdf({
      path: outPath,
      format: "A4",
      margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
      printBackground: true,
    });
    await page.close();
    console.log(`Done: ${outPath}`);
  }
  await browser.close();
})();
