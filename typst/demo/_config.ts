import lume from "lume/mod.ts";
import typst from "../mod.ts";

const site = lume();

// Initialize the plugin
site.use(typst());

export default site;
