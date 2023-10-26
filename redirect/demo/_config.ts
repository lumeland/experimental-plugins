import lume from "lume/mod.ts";
import redirects from "../mod.ts";

const site = lume();
site.use(redirects());

export default site;
