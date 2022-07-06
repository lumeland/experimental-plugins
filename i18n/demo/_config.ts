import lume from "lume/mod.ts";
import i18n from "../mod.ts";

const site = lume();

site
  .use(i18n());

export default site;
