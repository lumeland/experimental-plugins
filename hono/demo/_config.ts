import lume from "lume/mod.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import hono from "../mod.ts";

export default lume()
  .loadAssets([".css"])
  .use(hono())
  .use(codeHighlight());
