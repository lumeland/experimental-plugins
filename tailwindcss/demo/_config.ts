import lume from "lume/mod.ts";
import tailwind from "../mod.ts";

const site = lume({
  prettyUrls: false,
});

site.use(tailwind({
  options: {
    important: true,
  },
}));

site.loadPages([".html"]);

export default site;
