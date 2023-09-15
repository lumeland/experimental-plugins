import lume from "lume/mod.ts";
import relations from "lume/plugins/relations.ts";
import wordpress, { presetRelation } from "../mod.ts";

const site = lume();
site.use(relations({ foreignKeys: { ...presetRelation } }));

site.use(wordpress({
  baseUrl: "https://blog.oscarotero.com",
  limit: 100,
}));

export default site;
