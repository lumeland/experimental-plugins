import lume from "lume/mod.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import honojsx from "../mod.ts";

const site = lume();

site.loadAssets([".css"]);
site.use(honojsx());
site.use(
  codeHighlight({
    extensions: [".jsx", ".tsx", ".html"],
  }),
);

export default site;
