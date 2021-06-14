import lume from "lume/mod.js";
import tailwind from "../windicss.js";

const site = lume({
  prettyUrls: false,
});

site.use(tailwind());
site.loadPages([".html"]);

export default site;
