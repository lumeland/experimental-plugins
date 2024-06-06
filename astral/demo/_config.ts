import lume from "lume/mod.ts";
import { Page } from "lume/core/file.ts";
import astral from "../mod.ts";

const site = lume();
site.use(astral({
  callback: async (tab, page) => {
    await tab.waitForTimeout(1000);
    site.pages.push(Page.create({
      url: page.data.url + "foo.png",
      content: await tab.screenshot(),
    }));
  },
}));

export default site;
