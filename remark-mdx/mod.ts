import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils.ts";
import { compile } from "npm:@mdx-js/mdx@2.1.5";
import { join, toFileUrl } from "lume/deps/path.ts";
import { encode } from "lume/deps/base64.ts";
import { renderToString } from "lume/deps/preact.ts";

import type { Data, Engine, Site } from "lume/core.ts";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions: string[];

  /** List of remark plugins to use */
  // deno-lint-ignore no-explicit-any
  remarkPlugins?: any[];

  /** List of rehype plugins to use */
  // deno-lint-ignore no-explicit-any
  rehypePlugins?: any[];
}

// Default options
export const defaults: Options = {
  extensions: [".mdx"],
};

/** Template engine to render Markdown files with Remark */
export class MDXEngine implements Engine {
  baseUrl: string;
  options: Options;

  constructor(baseUrl: string, options: Options) {
    this.baseUrl = baseUrl;
    this.options = options;
  }

  deleteCache() {}

  async render(
    content: string,
    data?: Data,
    filename?: string,
  ): Promise<string> {
    const baseUrl = toFileUrl(join(this.baseUrl, filename!)).href;

    const result = await compile(content, {
      jsxImportSource: "",
      baseUrl,
      jsx: true,
      format: "mdx",
      outputFormat: "function-body",
      useDynamicImport: true,
      remarkPlugins: this.options.remarkPlugins,
      rehypePlugins: this.options.rehypePlugins,
    });

    const destructure = `{${Object.keys(data!).join(",")}}`;

    const code = `
export default async function (${destructure}) {
  ${result.toString()}
}
    `;

    const url = `data:text/jsx;base64,${encode(code)}`;
    const module = (await import(url)).default;
    const mdxContext = (await module(data)).default;

    const body = mdxContext({ components: { comp: data?.comp } });
    return renderToString(body);
  }

  renderSync(content: string) {
    return content;
  }

  addHelper() {}
}

/** Register the plugin to support MDX */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    // Load the pages
    const MdxEngine = new MDXEngine(site.src(), options);
    site.loadPages(options.extensions, loader, MdxEngine);
  };
}
