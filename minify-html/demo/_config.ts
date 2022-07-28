import lume from "lume/mod.ts";
import minifyHTML from "../mod.ts";

const site = lume();

site
  .use(minifyHTML({
    minifyHTML: true,
    minifyOptions: {
      do_not_minify_doctype: true,
      ensure_spec_compliant_unquoted_attribute_values: true,
      keep_spaces_between_attributes: true,
      minify_css: true,
      minify_js: true,
    },
  }));

export default site;
