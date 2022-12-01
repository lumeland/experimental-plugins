import lume from "lume/mod.ts";
import relations from "lume/plugins/relations.ts";
import wordpress from "../mod.ts";

const site = lume();
site.use(relations({
  foreignKeys: {
    wp_post: "wp_post_id",
    wp_tag: "wp_tag_id",
    wp_author: "wp_author_id",
    wp_category: "wp_category_id",
    wp_page: "wp_page_id",
  },
}));
site.use(wordpress({
  wp_url: "https://blog.oscarotero.com",
}));

export default site;
