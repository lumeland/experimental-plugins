import lume from "lume/mod.ts";
import relations from "lume/plugins/relations.ts";
import wordpress, { WP_REST_API } from "../mod.ts";

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

function wpTermToData(raw: WP_REST_API) {
  return {
    id: raw.id,
    url: new URL(raw.link).pathname,
    slug: raw.slug,
    title: raw.name,
    name: raw.name,
    count: raw.count,
    type: raw.taxonomy || "tag",
  };
}

site.use(wordpress({
  wp_url: "https://blog.oscarotero.com",
  limit: 100,
  transform: {
    "posts": function (raw) {
      return {
        id: raw.id,
        url: new URL(raw.link).pathname,
        slug: raw.slug,
        date: new Date(raw.date),
        title: raw.title.rendered,
        content: raw.content.rendered,
        excerpt: raw.excerpt.rendered,
        category_id: raw.categories,
        tag_id: raw.tags,
        sticky: raw.sticky,
        author_id: raw.author,
        type: "post",
      };
    },
    "pages": function (raw) {
      return {
        id: raw.id,
        url: new URL(raw.link).pathname,
        slug: raw.slug,
        date: new Date(raw.date),
        title: raw.title.rendered,
        content: raw.content.rendered,
        excerpt: raw.excerpt.rendered,
        author_id: raw.author,
        type: "page",
      };
    },
    "tags": wpTermToData,
    "categories": wpTermToData,
    "users": function (raw) {
      return {
        type: "author",
        id: raw.id,
        url: new URL(raw.link).pathname,
        slug: raw.slug,
        title: raw.name,
        name: raw.name,
        avatar_urls: raw.avatar_urls,
      };
    },
  },
}));

export default site;
