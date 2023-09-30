import lume from "lume/mod.ts";
import relations from "lume/plugins/relations.ts";
import wordpress from "../mod.ts";

const site = lume();
site.use(relations({
  foreignKeys: {
    post: {
      foreignKey: "post_id",
      pluralRelationKey: "posts",
    },
    tag: {
      foreignKey: "tag_id",
      pluralRelationKey: "tags",
    },
    author: {
      foreignKey: "author_id",
      pluralRelationKey: "authors",
    },
    category: {
      foreignKey: "category_id",
      pluralRelationKey: "categories",
    },
    page: {
      foreignKey: "page_id",
      pluralRelationKey: "pages",
    },
  },
}));

site.use(wordpress({
  baseUrl: "https://blog.oscarotero.com",
  maxPerCollection: 100,
}));

export default site;
