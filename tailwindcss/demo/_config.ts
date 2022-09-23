import lume from "lume/mod.ts";
import tailwindcss from "../mod.ts";

const site = lume();
site.use(tailwindcss());

export default site;
