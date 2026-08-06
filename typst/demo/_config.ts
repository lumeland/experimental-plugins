import lume from "lume/mod.ts";
import typst from "../mod.ts";

const site = lume();

site.add(
  "https://cdn.jsdelivr.net/gh/google/fonts@refs/heads/main/ofl/pacifico/Pacifico-Regular.ttf",
  "/fonts/Pacifico-Regular.ttf",
);

site.use(typst());

export default site;
