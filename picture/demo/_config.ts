import lume from "lume/mod.ts";
import imagick from "lume/plugins/imagick.ts";
import picture from "../main.ts";

const site = lume();

site.use(picture());
site.use(imagick());

export default site;
