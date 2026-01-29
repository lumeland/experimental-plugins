import lume from "lume/mod.ts";
import imageSize from "../mod.ts";

const site = lume();
site.use(imageSize());
site.add([".jpg"]);

export default site;
