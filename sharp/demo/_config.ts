import lume from "lume/mod.ts";
import sharp from "../mod.ts";

const site = lume();

site
  .use(sharp({
    cache: false,
  }));

export default site;
