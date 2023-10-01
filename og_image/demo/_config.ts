import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";
import ogImage from "../mod.ts";

const site = lume();
site.use(ogImage());
site.use(metas());

export default site;
