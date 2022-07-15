import lume from "lume/mod.ts";
import nanojsx from "../mod.ts";

const site = lume();

site
  .use(nanojsx());

export default site;
