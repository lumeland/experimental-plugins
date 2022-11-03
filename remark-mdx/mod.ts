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
}

// Default options
export const defaults: Options = {
  extensions: [".mdx"],
};

/** Template engine to render Markdown files with Remark */
export class MDXEngine implements Engine {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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
    });
    console.log(result.toString());
    const url = `data:text/jsx;base64,${encode(result.toString())}`;
    const module = (await import(url)).default;
    const component = await module(data);
    const html = renderToString(component);

    return html;
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
    const MdxEngine = new MDXEngine(site.src());
    site.loadPages(options.extensions, loader, MdxEngine);
  };
}
