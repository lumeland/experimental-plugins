import lume from "lume/mod.ts";
import sri from "../mod.ts";

const site = lume();
site.use(sri());

export default site;
