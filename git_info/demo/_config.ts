import lume from "lume/mod.ts";
import gitInfo from "../mod.ts";

const site = lume();
site.use(gitInfo());

export default site;
