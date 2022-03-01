import lume from "lume/mod.ts";
import jimp from "../mod.ts";

const site = lume();

site
  .use(jimp());

export default site;
