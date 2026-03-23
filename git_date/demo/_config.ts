import lume from "lume/mod.ts";
import gitDate from "../mod.ts";

const site = lume();
site.use(gitDate());

export default site;
