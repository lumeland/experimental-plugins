import lume from "lume/mod.ts";
import validateHtml from "../mod.ts";

const site = lume();
site.use(validateHtml());

export default site;
