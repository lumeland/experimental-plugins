import lume from "lume/mod.ts";
import hash from "../mod.ts";

const site = lume();

site.copy("kevin-schmid-unsplash.jpg");
site.use(hash());

export default site;
