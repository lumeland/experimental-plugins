import lume from "lume/mod.ts";
import webc from "../mod.ts";

const site = lume();
site.use(webc());

export default site;
