import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE ERROR:", m.text()));
let allOk = true;
for (const path of ["/", "/not-found-page"]) {
  await page.goto("http://127.0.0.1:3470" + path, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 400));
  const result = await page.evaluate(() => {
    const icons = Array.from(document.querySelectorAll("i.fa-solid, i.fa-brands"));
    const bad = icons.filter((el) => getComputedStyle(el, "::before").getPropertyValue("content").startsWith("none"));
    return { total: icons.length, bad: bad.length, missing: bad.slice(0, 5).map((b) => b.getAttribute("class")) };
  });
  const ok = result.bad === 0;
  allOk = allOk && ok;
  console.log(`${path.padEnd(16)} ${ok ? "OK" : "FAIL"} (${result.total} icons, ${result.bad} missing) ${ok ? "" : JSON.stringify(result.missing)}`);
}
console.log(allOk ? "ALL PAGES ICON CHECK PASSED" : "ICON CHECK FAILED");
await browser.close();
