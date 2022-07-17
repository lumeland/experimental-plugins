import lume from "lume/mod.ts";
import preact from "../mod.ts";

const site = lume();

site
  .use(preact());

export default site;
