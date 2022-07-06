import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils.ts";
import { unified, remarkParse, remarkGfm, remarkRehype, rehypeRaw, rehypeSanitize, rehypeStringify } from "./deps.ts";

import type { Data, Engine, Helper, Site } from "lume/core.ts";

export interface Options {
  /** List of extensions this plugin applies to */
  extensions: string[],

  /** List of remark plugins to use */
  remarkPlugins?: unknown[],

  /** List of rehype plugins to use */
  rehypePlugins?: unknown[],

  /** Flag to turn on HTML sanitization to prevent XSS */
  sanitize?: boolean
}

// Default options
export const defaults: Options = {
  extensions: [".md"],
  // By default, GitHub-flavored markdown is enabled
  remarkPlugins: [remarkGfm],
  sanitize: false
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

    const plugins = [];

    // Add remark-parse to generate MDAST
    plugins.push(remarkParse);

    // Add remark plugins
    options.remarkPlugins?.forEach(plugin => plugins.push(plugin));

    // Add remark-rehype to generate HAST
    plugins.push([remarkRehype, { allowDangerousHtml: true }]);

    if (options.sanitize) {
      // Add rehype-raw to convert raw HTML to HAST
      plugins.push(rehypeRaw);
    }

    // Add rehype plugins
    options.rehypePlugins?.forEach(plugin => plugins.push(plugin));

    if (options.sanitize) {
      // Add rehype-sanitize to make sure HTML is safe
      plugins.push(rehypeSanitize);
      // Add rehype-stringify to output HTML ignoring raw HTML nodes
      plugins.push(rehypeStringify);
    } else {
      // Add rehype-stringify to output HTML
      plugins.push([rehypeStringify, { allowDangerousHtml: true }]);
    }

    // Register all plugins
    // @ts-ignore: let unified take care of loading all the plugins
    engine.use(plugins);

    // Load the pages
    site.loadPages(options.extensions, loader, new MarkdownEngine(engine));

    // Register the md and mdAsync filters
    site.filter("md", filterSync as Helper);
    site.filter("mdAsync", filter as Helper, true);

    function filter(string: string): Promise<string> {
      return engine.process(string?.toString() || "").then(result => result.toString().trim());
    }

    function filterSync(string: string): string {
      return engine.processSync(string?.toString() || "").toString().trim();
    }
  }
}
