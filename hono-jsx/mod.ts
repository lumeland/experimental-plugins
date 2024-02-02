import loader from "lume/core/loaders/module.ts";
import type { Engine, Helper } from "lume/core/renderer.ts";
import type Site from "lume/core/site.ts";
import { merge } from "lume/core/utils/object.ts";
import { jsx, specifier } from "./deps.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Optional sub-extension for page files */
  pageSubExtension?: string;

  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string;
}

// Default options
export const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

/** Template engine to render JSX files using Hono */
export class HonoJsxEngine implements Engine {
  jsxImportSource = specifier;
  helpers: Record<string, Helper> = {};
  basePath: string;
  includes: string;

  constructor(basePath: string, includes: string) {
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache() {}

  async render(content: unknown, data: Record<string, unknown> = {}) {
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
      : typeof content === "function"
      ? await content({ ...data, children }, this.helpers)
      : content;

    return element;
  }

  renderComponent(content: unknown, data: Record<string, unknown> = {}) {
    const element = typeof content === "function"
      ? content(data, this.helpers)
      : content;

    return element;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}

/** Register the plugin to support JSX and TSX files */
export default function (userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const engine = new HonoJsxEngine(site.src("/"), options.includes);

    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}
