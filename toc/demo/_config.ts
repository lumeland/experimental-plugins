import lume from "lume/mod.ts";
import toc from "../mod.ts";

const site = lume();
site.use(toc({
  anchor: false,
}));

export default site;
