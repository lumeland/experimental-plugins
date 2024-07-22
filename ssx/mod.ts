import "https://deno.land/x/ssx@v0.1.0/jsx-runtime.ts";
import loader from "lume/core/loaders/module.ts";
import { merge } from "lume/core/utils/object.ts";

import type Site from "lume/core/site.ts";
import type { Engine, Helper } from "lume/core/renderer.ts";

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

// JSX children type
export type Children = JSX.Children;

/** Template engine to render JSX files using Preact */
export class SSXEngine implements Engine {
  jsxImportSource = "ssx";
  helpers: Record<string, Helper> = {};
  basePath: string;
  includes: string;

  constructor(basePath: string, includes: string) {
    this.basePath = basePath;
    this.includes = includes;
  }

  deleteCache() {}

  async render(content: unknown, data: Record<string, unknown> = {}) {
    // The content is a string, so we have to convert it to an element
    if (typeof content === "string") {
      content = { __html: content };
    }

    // Create the children property
    let children = data.content;

    // If the children is a string, convert it to a Preact element
    if (typeof children === "string") {
      children = { __html: children };
    }

    return (typeof content === "function"
      ? await content({ ...data, children }, this.helpers)
      : content);
  }

  renderComponent() {
    return "";
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

    const engine = new SSXEngine(site.src(), options.includes);

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load the pages and register the engine
    site.loadPages(options.extensions, {
      loader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });
  };
}
