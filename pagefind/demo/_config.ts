import lume from "lume/mod.ts";
import pagefind from "../mod.ts";

const site = lume();
site.use(pagefind());

export default site;
