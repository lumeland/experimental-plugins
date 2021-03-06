import lume from "lume/mod.ts";
import windicss from "../windicss.ts";

const site = lume({
  prettyUrls: false,
});

site.use(windicss({
  config: {
    shortcuts: {
      "btn-green": "text-white bg-green-500 hover:bg-green-700",
    },
  },
}));
site.loadPages([".html"]);

export default site;
