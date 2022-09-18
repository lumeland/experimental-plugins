import loader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils.ts";
import { Exception } from "lume/core/errors.ts";
import { encode } from "lume/deps/base64.ts";
import { posix, toFileUrl } from "lume/deps/path.ts";
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

/** Register the plugin to support Markdown */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return function (site: Site) {
    const mdEngine = site.formats.get(".md")?.engines?.[0];

    if (!mdEngine) {
      throw new Error("Lume mdx requires a markdown engine");
    }

    // Load the pages
    site.loadPages(
      options.extensions,
      loader,
      new MdxEngine(mdEngine, site.src()),
    );
  };
}

/** Template engine to render Markdown files combined with Preact */
export class MdxEngine implements Engine {
  mdEngine: Engine;
  basePath: string;

  constructor(mdEngine: Engine, basePath: string) {
    this.mdEngine = mdEngine;
    this.basePath = basePath;
  }

  deleteCache() {}

  async render(
    content: string,
    data?: Data,
    filename?: string,
  ): Promise<string> {
    const result = await parseJSX(this.basePath, filename, content, data);
    return this.mdEngine.render(result, data, filename) as string;
  }

  renderSync(): string {
    throw new Error("renderSync is not supported");
  }

  addHelper() {}
}

/** Parse a string as JSX */
export async function parseJSX(
  basePath: string,
  filename: string,
  content: string,
  data: Record<string, unknown> = {},
): Promise<string> {
  const baseUrl = new URL(
    "./",
    toFileUrl(posix.join(basePath, posix.dirname(filename || "/"), "/")),
  );
  // Collect imports
  const imports: string[] = [];

  content = content.replaceAll(
    /import\s+[\w\W]+?\s+from\s+("[^"]+"|'[^']+');?/g,
    (code, path) => {
      // Resolve relative urls
      const quote = path.slice(0, 1);
      let url = path.slice(1, -1);
      if (url.startsWith(".")) {
        url = new URL(url, baseUrl).href;
        code = code.replace(path, quote + url + quote);
      }
      imports.push(code);
      return "";
    },
  ).trim();

  // Destructure arguments
  const destructure = `{${Object.keys(data).join(",")}}`;
  // Keep the curly brakets inside fenced code blocks ({ -> {"{"})
  content = content.replaceAll(
    /(```\w*)\n(?<code>[\s\S]+?)\n```/g,
    (_, start, code) => {
      return `${start}\n${
        code.replaceAll(/[{}]/g, (char: string) => `{"${char}"}`)
      }\n\`\`\``;
    },
  );
  // Keep the line breaks (\n -> {"\n"})
  content = content.replaceAll(/(\n\r?)/g, '\n{"\\n"}\n');

  const code = `/** @jsxImportSource preact */
  ${imports.join("\n")}
  export default async function (${destructure}, helpers) { return <>${content}</> }`;
  const url = `data:text/jsx;base64,${encode(code)}`;

  try {
    const result = (await import(url)).default;
    return renderToString(await result(data));
  } catch (error) {
    const [line, column] = error.stack.match(/:(\d+):(\d+)/)?.slice(1) || [];

    throw new Exception(error.message, {
      cause: error.cause,
      mark: {
        file: filename,
        line,
        column,
        code,
      },
    });
  }
}
