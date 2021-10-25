import lume from "lume/mod.ts";
import minify from "../minify.ts";

const site = lume();

site
  .loadAssets([".css"])
  .use(minify({
    extensions: [".css", ".html"],
    htmlOptions: {
      minifyCSS: true,
    },
  }));

export default site;
