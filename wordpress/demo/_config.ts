import lume from "lume/mod.ts";
import wordpress from "../mod.ts";

const site = lume();
site.use(wordpress({
  wp_url: "https://blog.oscarotero.com",
}));

export default site;
