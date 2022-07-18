import lume from "lume/mod.ts";
import preactjsx from "../mod.ts";

const site = lume();

site
  .use(preactjsx());

export default site;
