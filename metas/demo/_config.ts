import lume from "lume/mod.ts";
import metas from "../mod.ts";

const site = lume();

site
  .use(metas());

export default site;
