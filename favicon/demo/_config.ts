import lume from "lume/mod.ts";
import favicon from "../mod.ts";

const site = lume();
site.use(favicon());

export default site;
