import lume from "lume/mod.ts";
import pwa from "../mod.ts";

const site = lume();

site.use(pwa());

export default site;
