import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils.ts";
import {
  hastUtilHasProperty,
  hastUtilHeadingRank,
  hastUtilToString,
  rehypeRaw,
  rehypeSanitize,
  rehypeStringify,
  remarkGfm,
  remarkParse,
  remarkRehype,
  unified,
  unistUtilVisit,
} from "./deps.ts";

import type { Data, Engine, Helper, Page, Site } from "lume/core.ts";

export interface MarkdownHeading {
  /** Heading id */
  id: string;

  /** Rank or depth of the heading */
  depth: number;

  /** InnerText of the heading */
  text: string;
}

export interface Options {
  /** List of extensions this plugin applies to */
  extensions: string[];

  /** List of remark plugins to use */
  remarkPlugins?: unknown[];

  /** List of rehype plugins to use */
  rehypePlugins?: unknown[];

  /** Flag to turn on HTML sanitization to prevent XSS */
  sanitize?: boolean;

  /** Flag to override the default plugins */
  overrideDefaultPlugins?: boolean;
}

const headings: MarkdownHeading[] = [];

function rehypeCollectHeadings() {
  // @ts-ignore: this is unist tree
  return (tree) => {
    // collect all headings
    headings.length = 0;
    unistUtilVisit.visit(tree, "element", (node) => {
      const rank = hastUtilHeadingRank.headingRank(node);
      if (
        rank && node.properties && hastUtilHasProperty.hasProperty(node, "id")
      ) {
        headings.push({
          id: node.properties.id,
          depth: rank,
          text: hastUtilToString.toString(node),
        });
      }
    });
  };
}

// Default options
export const defaults: Options = {
  extensions: [".md"],
  // By default, GitHub-flavored markdown is enabled
  remarkPlugins: [remarkGfm],
  sanitize: false,
};

/** Template engine to render Markdown files with Remark */
export class MarkdownEngine implements Engine {
  engine: unified.Processor;

  constructor(engine: unified.Processor) {
    this.engine = engine;
  }

  deleteCache() {}

  async render(content: string, data?: Data): Promise<string> {
    const processed = (await this.engine.process(content)).toString();
    if (data) {
      // inject headings in data
      data.headings = [...headings];
    }
    return processed;
  }

  renderSync(content: string, data?: Data): string {
    const processed = this.engine.processSync(content).toString();
    if (data) {
      // inject headings in data
      data.headings = [...headings];
    }
    return processed;
  }

  addHelper() {}
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

    if (!options.overrideDefaultPlugins) {
      // Add default remark plugins
      defaults.remarkPlugins?.forEach((defaultPlugin) =>
        plugins.push(defaultPlugin)
      );
    }

    // Add remark plugins
    options.remarkPlugins?.forEach((plugin) => plugins.push(plugin));

    // Add remark-rehype to generate HAST
    plugins.push([remarkRehype, { allowDangerousHtml: true }]);

    if (options.sanitize) {
      // Add rehype-raw to convert raw HTML to HAST
      plugins.push(rehypeRaw);
    }

    // Add rehype plugins
    options.rehypePlugins?.forEach((plugin) => plugins.push(plugin));

    // Add plugin to collect headings
    plugins.push(rehypeCollectHeadings);

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
    const remarkEngine = new MarkdownEngine(engine);
    site.loadPages(options.extensions, loader, remarkEngine);

    // Register the md and mdAsync filters
    site.filter("md", filter as Helper);
    site.filter("mdAsync", filterAsync as Helper, true);

    async function filterAsync(content: string | Page): Promise<string | Page> {
      const text = typeof content === "string"
        ? content
        : content.content as string;
      const processed = (await remarkEngine.render(text)).trim();

      if (typeof content !== "string") {
        content.content = processed;
        // @ts-ignore: inject headings in page data
        content.headings = [...headings];
      }

      return processed;
    }

    function filter(content: string | Page): string | Page {
      const text = typeof content === "string"
        ? content
        : content.content as string;
      const processed = remarkEngine.renderSync(text).trim();

      if (typeof content !== "string") {
        content.content = processed;
        // @ts-ignore: inject headings in page data
        content.headings = [...headings];
      }

      return processed;
    }
  };
}
