import lume from "lume/mod.ts";
import postcss from "lume/plugins/postcss.ts";
import tailwind from "../mod.ts";

const site = lume({
  prettyUrls: false,
});

site.use(tailwind({
  options: {
    important: true,
  },
}));
site.use(postcss());
site.loadPages([".html"]);

export default site;
