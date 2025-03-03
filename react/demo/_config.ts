import lume from "lume/mod.ts";
import react from "../mod.ts";
import lightningcss from "lume/plugins/lightningcss.ts";

const site = lume();
site.use(react());
site.use(lightningcss());
export default site;
