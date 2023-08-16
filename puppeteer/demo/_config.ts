import lume from "lume/mod.ts";
import puppeteer from "../mod.ts";

const site = lume();
site.use(puppeteer({
  async callback(page) {
    const result = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("code")).map((svg) =>
        svg.outerHTML
      );
    });
    console.log(result);
  },
}));

export default site;
