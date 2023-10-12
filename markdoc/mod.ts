import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils.ts";

import type { Data, Engine, Site } from "lume/core.ts";

import Markdoc, { type Config } from "npm:@markdoc/markdoc@0.3.2";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions: string[];
  /** Markdoc Config */
  config?: Config;
}

// Default options
export const defaults: Options = {
  extensions: [".mdoc"],
  config: {},
};

export class MarkdocEngine implements Engine {
  options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  deleteCache() {}

  render(content: string, data?: Data, filename?: string): string {
    return this.renderSync(content, data, filename);
  }

  renderSync(content: string, data?: Data, _filename?: string): string {
    return Markdoc.renderers.html(
      Markdoc.transform(
        Markdoc.parse(content),
        {
          ...this.options.config,
          variables: {
            ...(this.options.config?.variables ?? {}),
            markdoc: { frontmatter: data },
          },
        },
      ),
    );
  }

  addHelper() {}
}

export default (userOptions?: Partial<Options>) => {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const markdocEngine = new MarkdocEngine(options);
    site.loadPages(options.extensions, loader, markdocEngine);
  };
};
