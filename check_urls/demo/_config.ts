import lume from "lume/mod.ts";
import resolve_urls from "lume/plugins/resolve_urls.ts";
import check_urls from "../mod.ts";

const site = lume();
site.use(resolve_urls());
site.use(check_urls());
site.copy("assets");

export default site;
