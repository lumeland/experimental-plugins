import lume from "lume/mod.ts";
import prism from "../mod.ts";

const site = lume();

site
  .use(prism());

export default site;
