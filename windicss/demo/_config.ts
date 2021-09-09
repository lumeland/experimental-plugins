import lume from "lume/mod.ts";
import windicss from "../windicss.ts";

const site = lume({
  prettyUrls: false,
});

site.use(windicss());
site.loadPages([".html"]);

export default site;
