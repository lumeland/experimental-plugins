import { jsx } from "./deps.ts";
import loader from "lume/core/loaders/module.ts";
import { merge } from "lume/core/utils.ts";

import type { Data, Engine, Helper, Site } from "lume/core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[] | {
    pages: string[];
    components: string[];
  };
}

// Default options
export const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

/** Template engine to render JSX files using Hono */
export class HonoJsxEngine implements Engine {
  helpers: Record<string, Helper> = {};

  deleteCache() { }

  async render(content: unknown, data: Data = {}) {
    // The content is a string, so we have to convert it to a element
    if (typeof content === "string") {
      content = jsx("div", {
        dangerouslySetInnerHTML: { __html: content },
      });
    }

    // Create the children property
    let children = data.content;

    // If the children is a string, convert it to a element
    if (typeof children === "string") {
      children = jsx("div", {
        dangerouslySetInnerHTML: { __html: children },
      });
    }

    const element = typeof content === "object"
      ? content
      : (typeof content === "function"
        ? await content({ ...data, children }, this.helpers)
        : content)

    return element
  }

  renderSync(content: unknown, data: Data = {}) {
    const element = typeof content === "function"
      ? content(data, this.helpers)
      : content as string

    return element
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/** Register the plugin to support JSX and TSX files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, components: options.extensions }
    : options.extensions;

  return (site: Site) => {
    const engine = new HonoJsxEngine();

    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}
