import lume from "lume/mod.ts";
import minifyHTML from "../mod.ts";

const site = lume();

site
  .use(minifyHTML({
    extensions: [".html", ".css", ".js"],
    options: {
      do_not_minify_doctype: true,
      ensure_spec_compliant_unquoted_attribute_values: true,
      keep_spaces_between_attributes: true
    },
  }));

export default site;
