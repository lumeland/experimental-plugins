import lume from "lume/mod.ts";
import nav from "../mod.ts";

const site = lume();
site.use(nav());

export default site;
