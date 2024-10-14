import lume from "lume/mod.ts";
import icons from "../mod.ts";
import inline from "lume/plugins/inline.ts";

const site = lume();
site.use(icons());
site.use(inline());

export default site;
