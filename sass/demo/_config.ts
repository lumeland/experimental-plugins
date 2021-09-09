import lume from "lume/mod.ts";
import sass from "../sass.ts";

const site = lume();

site.use(sass());

export default site;
