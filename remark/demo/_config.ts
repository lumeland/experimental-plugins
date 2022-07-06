import lume from "lume/mod.ts";
import remark from "../remark.ts";
import rehypeAutolinkHeadings from "https://esm.sh/rehype-autolink-headings@6.1.1";
import rehypeExternalLinks from "https://esm.sh/rehype-external-links@1.0.1";
import remarkSmartyPants from "https://esm.sh/remark-smartypants@2.0.0";

const site = lume();

site.use(remark({
  remarkPlugins: [
    remarkSmartyPants
  ],
  rehypePlugins: [
    rehypeExternalLinks,
    [
      rehypeAutolinkHeadings, {
        behavior: "append"
      }
    ]
  ]
}));

export default site;
