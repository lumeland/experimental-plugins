import lume from "lume/mod.ts";
import components from "../components.ts";

const site = lume();

site.use(components());

export default site;
