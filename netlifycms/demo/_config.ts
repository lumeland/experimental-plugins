import lume from "lume/mod.ts";
import netlifyCMS from "../mod.ts";

const site = lume();

site
  .use(netlifyCMS());

export default site;
