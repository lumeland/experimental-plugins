import lume from "lume/mod.ts";
import unocss from "../mod.ts";

const site = lume();
site.use(unocss({
  cssFile: 'uno.css'
}));

export default site;
