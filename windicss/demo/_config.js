import lume from "lume/mod.js";
import windicss from "../windicss.js";

const site = lume({
  prettyUrls: false,
});

site.use(windicss());
site.loadPages([".html"]);

export default site;
