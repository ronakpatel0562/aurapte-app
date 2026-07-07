const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SRC_DIR = "C:\\Users\\ronak\\Downloads\\PredictionFile";
const OUT_DIR = path.join(__dirname, "..", "private-assets", "prediction-files");

const FILES = [
  { src: "ETM.html", out: "Exam-This-Month.pdf", repeatHeader: true },
  { src: "ASQ.html", out: "Answer-Short-Question.pdf" },
  { src: "DI.html", out: "Describe-Image.pdf" },
  { src: "FIB.html", out: "Fill-in-the-Blanks.pdf" },
  { src: "RS.html", out: "Repeat-Sentence.pdf" },
  { src: "RTS.html", out: "Responding-to-Situation.pdf" },
  { src: "SST.html", out: "Summarize-Spoken-Text.pdf" },
  { src: "WE.html", out: "Write-an-Email.pdf" },
  { src: "WFD.html", out: "Write-from-Dictation.pdf" },
];

const logoBase64 = fs.readFileSync(path.join(SRC_DIR, "logo.png")).toString("base64");

const HEADER_TEMPLATE = `
  <div style="font-size:9px; width:100%; padding:0 20mm; margin:0; display:flex; align-items:center; gap:6px; color:#1a365d; -webkit-print-color-adjust:exact;">
    <img src="data:image/png;base64,${logoBase64}" style="width:14px; height:14px; border-radius:3px; display:block;">
    <span style="font-weight:bold;">AuraPTE</span>
    <span style="margin-left:auto; color:#888;">aurapte.com</span>
  </div>`;

const FOOTER_TEMPLATE = `
  <div style="font-size:8px; width:100%; text-align:center; color:#888;">
    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
  </div>`;

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
      margin: f.repeatHeader
        ? { top: "18mm", bottom: "14mm", left: "20mm", right: "20mm" }
        : { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
      printBackground: true,
      displayHeaderFooter: !!f.repeatHeader,
      headerTemplate: f.repeatHeader ? HEADER_TEMPLATE : undefined,
      footerTemplate: f.repeatHeader ? FOOTER_TEMPLATE : undefined,
    });
    await page.close();
    console.log(`Done: ${outPath}`);
  }
  await browser.close();
})();
