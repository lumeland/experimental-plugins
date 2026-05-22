import lume from "lume/mod.ts";
import downloader from "../mod.ts";

const site = lume();

site.use(downloader({
	origins: ["lume.land"],
	attribute: "add"
}));

export default site;
