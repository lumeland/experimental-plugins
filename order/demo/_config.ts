import lume from "lume/mod.ts";
import order from "../mod.ts";
import nav from "lume/plugins/nav.ts";

const site = lume();
site.use(order());
site.use(nav());

export default site;
