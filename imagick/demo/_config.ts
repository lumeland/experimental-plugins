import lume from "lume/mod.ts";
import imagick from "../imagick.ts";

const site = lume();

site
  .use(imagick());

export default site;
