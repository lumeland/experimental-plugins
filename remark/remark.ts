import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils.ts";
import { unified, remarkParse, remarkGfm, remarkRehype, rehypeStringify } from "./deps.ts";

import type { Data, Engine, Helper, Site } from "lume/core.ts";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions: string[],

  /** List of remark plugins to use */
  remarkPlugins?: unknown[],

  /** List of rehype plugins to use */
  rehypePlugins?: unknown[]
}

// Default options
export const defaults: Options = {
  extensions: [".md"],
  // By default, GitHub-flavored markdown is enabled
  remarkPlugins: [remarkGfm],
  rehypePlugins: []
}

export function loadPlugin(plugin: unknown, engine: unified.Processor) {
  if (Array.isArray(plugin)) {
    const [pluginWithOps, ...opts] = plugin;
    engine.use(pluginWithOps, ...opts);
  } else {
    // @ts-ignore: Some plugins may not have types available
    engine.use(plugin);
  }
}

/** Template engine to render Markdown files with Remark */
export class MarkdownEngine implements Engine {
  engine: unified.Processor;

  constructor(engine: unified.Processor) {
    this.engine = engine;
  }

  deleteCache() { }

  render(content: string, data?: Data, filename?: string): Promise<string> {
    return this.engine.process(content).then(result => result.toString());
  }

  renderSync(content: string, data?: Data, filename?: string): string {
    return this.engine.processSync(content).toString();
  }

  addHelper() { }
}

/** Register the plugin to support Markdown */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    // @ts-ignore: This expression is not callable
    const engine = unified.unified();

    // Register remark-parse to generate MDAST
    // @ts-ignore: remark-parse does not have correct types available
    engine.use(remarkParse);

    // Register remark plugins
    options.remarkPlugins?.forEach((plugin: unknown) => loadPlugin(plugin, engine));

    // Register remark-rehype to generate HAST
    engine.use(remarkRehype, {
      allowDangerousHtml: true
    })

    // Register rehype plugins
    options.rehypePlugins?.forEach((plugin: unknown) => loadPlugin(plugin, engine));

    // Register rehype-stringify to output HTML
    // @ts-ignore: rehype-stringify does not have correct types available
    engine.use(rehypeStringify, {
      allowDangerousHtml: true
    })

    // Load the pages
    site.loadPages(options.extensions, loader, new MarkdownEngine(engine));

    // Register the md and mdSync filters
    site.filter("md", filter as Helper);
    site.filter("mdSync", filterSync as Helper);

    function filter(string: string): Promise<string> {
      return engine.process(string?.toString() || "").then(result => result.toString().trim());
    }

    function filterSync(string: string): string {
      return engine.processSync(string?.toString() || "").toString().trim();
    }
  }
}
