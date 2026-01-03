import lume from "lume/mod.ts";
import epub from "../mod.ts"

const site = lume({
  prettyUrls: false,
});
site.use(epub());
site.add("css")

export default site;
