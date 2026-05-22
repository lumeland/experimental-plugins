import lume from "lume/mod.ts";
import webawesome from "../mod.ts";

const site = lume();
site.use(webawesome())

export default site;
