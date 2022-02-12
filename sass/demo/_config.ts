import lume from "lume/mod.ts";
import sass from "../sass.ts";

const site = lume({
  src: "./src",
});

site.use(sass());

export default site;
