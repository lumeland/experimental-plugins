import lume from "lume/mod.ts";
import vento from "../mod.ts";

const site = lume();
site.use(vento());

export default site;
