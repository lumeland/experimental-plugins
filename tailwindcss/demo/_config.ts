import lume from "lume/mod.ts";
import tailwind from "../mod.ts";

const site = lume();

site.use(tailwind());

export default site;
