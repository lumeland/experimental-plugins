import lume from "lume/mod.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";
import sitemap from "../sitemap.ts";

const site = lume();

site
  .use(slugifyUrls())
  .use(sitemap());

export default site;
