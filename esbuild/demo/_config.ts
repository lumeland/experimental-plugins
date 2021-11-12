import lume from "lume";
import esbuild from "../esbuild.ts";

const site = lume();

site.use(esbuild());
site.ignore("js/lib");

export default site;
