import lume from "lume/mod.ts";
import cache_busting from "../mod.ts";

const site = lume();

site.copy("./img/kevin-schmid-unsplash.jpg");
site.copy("./page2/unsplash.jpg");
site.use(cache_busting());

export default site;
