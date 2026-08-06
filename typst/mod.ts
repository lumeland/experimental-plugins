import textLoader from "lume/core/loaders/text.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { merge } from "lume/core/utils/object.ts";
import { log } from "lume/core/utils/log.ts";
import { NodeCompiler } from "./deps.ts";

import type { Entry } from "lume/core/fs.ts";
import type Site from "lume/core/site.ts";
import type { Engine, Helper } from "lume/core/renderer.ts";

// Import types from deps.ts for TypeScript safety
import type {
  CompileDocArgs,
  NodeCompiler as NodeCompilerType,
} from "./deps.ts";

export interface Options {
  /** Options used when exporting to PDF. */
  pdf?: {
    /** The PDF standard to target, e.g. `"1.7"` or `"a-2b"`. */
    standard?: string;
    /** Whether to write a tagged (accessible) PDF. @default true */
    tags?: boolean;
    /** A fixed creation timestamp, in seconds since the epoch. */
    creationTimestamp?: number;
  };

  /**
   * Options used when exporting to SVG:
   *
   * "plain" flattens text/images into a fully self-contained SVG — required
   * for static rasterizers (resvg, Sharp/librsvg, ImageMagick). "rich" emits
   * Typst's deduplicated/optimized SVG — smaller for text-heavy docs, but
   * only safe when the consumer is a real browser engine.
   */

  svg?: {
    /** Extension used for plain SVG */
    plainExtension: string;
    /** Extension used for rich SVG */
    richExtension: string;
  };
}

// 2. Explicitly type defaults as `Options` instead of using `satisfies Options`
export const defaults: Options = {
  svg: {
    plainExtension: ".svg",
    richExtension: ".rich.svg",
  },
};

type ResolvedOptions =
  & Omit<Required<Options>, "pageSubExtension">
  & {
    pageSubExtension?: string;
  };

export class TypstEngine implements Engine {
  readonly #site: Site;
  readonly #options: ResolvedOptions;
  #compiler?: NodeCompilerType;

  constructor(site: Site, options: ResolvedOptions) {
    this.#site = site;
    this.#options = options;
  }

  initCompiler(fontBlobs: Buffer[], sources: [string, string][]) {
    if (!this.#compiler) {
      this.#compiler = NodeCompiler.create({
        workspace: "/",
        fontArgs: [{ fontBlobs }],
      });
    }
    for (const [path, content] of sources) {
      this.#compiler.addSource(path, content);
    }
  }

  /** async access to the underlying compiler */
  #getCompiler(): NodeCompilerType {
    if (!this.#compiler) {
      throw new Error("Uninitialized compiler");
    }
    return this.#compiler;
  }

  deleteCache(): void {
    this.#compiler = undefined;
  }

  #format(url: unknown) {
    if (typeof url !== "string") {
      return "html";
    }
    if (url.endsWith(".pdf")) return "pdf";
    const { plainExtension, richExtension } = this.#options.svg;
    if (url.endsWith(plainExtension) && !url.endsWith(richExtension)) {
      return "plain_svg";
    }
    if (url.endsWith(richExtension) && !url.endsWith(plainExtension)) {
      return "rich_svg";
    }
    return "html";
  }

  render(
    content: string,
    data: Record<string, unknown>,
    filename?: string,
  ): string | Uint8Array {
    const compiler = this.#getCompiler();
    const format = this.#format(data.url);
    const inputs: Record<string, string> = {
      "x-target": format,
      ...Object.fromEntries(
        Object.entries(data).filter(([, value]) =>
          typeof value === "string" || typeof value === "number"
        ),
      ),
    };

    const args: CompileDocArgs = { inputs };

    if (filename) {
      compiler.addSource(filename, content);
      args.mainFilePath = filename;
    } else {
      args.mainFileContent = content;
    }

    try {
      switch (format) {
        case "rich_svg":
          return this.#renderRichSvg(args);
        case "plain_svg":
          return this.#renderPlainSvg(args);
        case "pdf":
          return this.#renderPdf(args);
        default:
          return this.#renderHtml(args);
      }
    } catch (error) {
      log.error(
        `[typst plugin] Failed to compile ${
          filename ?? "unknown"
        } (${format}): ${error} ${(error as { code: string }).code}`,
      );
      throw error;
    }
  }

  #renderRichSvg(args: CompileDocArgs) {
    const compiler = this.#getCompiler();
    return compiler.svg(args);
  }

  #renderPlainSvg(args: CompileDocArgs) {
    const compiler = this.#getCompiler();
    return compiler.plainSvg(args);
  }

  #renderPdf(args: CompileDocArgs) {
    const compiler = this.#getCompiler();
    const { standard: pdfStandard, tags: pdfTags, creationTimestamp } =
      this.#options.pdf ?? {};
    return compiler.pdf(args, {
      pdfStandard,
      pdfTags,
      creationTimestamp,
    });
  }

  #renderHtml(args: CompileDocArgs) {
    const compiler = this.#getCompiler();
    const result = compiler.tryHtml(args);

    if (result.hasError()) {
      result.printErrors();
      throw new Error(
        `[typst plugin] HTML compilation failed for ${
          args.mainFilePath ?? "unknown"
        }`,
      );
    }
    return result.result?.body() ?? "";
  }

  addHelper() {}
}

export function typst(userOptions?: Options) {
  const options = merge(
    defaults,
    userOptions,
  ) as ResolvedOptions;

  return (site: Site) => {
    const engine = new TypstEngine(site, options);
    let blobs: Buffer[] | undefined;

    site.loadPages([".typ"], {
      loader: textLoader,
      engine,
    });

    site.addEventListener("beforeRender", async (event) => {
      // Load all fonts added to Lume
      if (!blobs) {
        const fontsExtensions = new Set([".woff2", ".woff", ".ttf", ".otf"]);
        const fonts: Entry[] = [
          ...event.pages
            .filter((page) => fontsExtensions.has(page.src.ext))
            .map((page) => page.src.entry)
            .filter((entry) => entry !== undefined),
          ...site.files
            .filter((file) => fontsExtensions.has(file.src.ext))
            .map((file) => file.src.entry)
            .filter((entry) => entry !== undefined),
        ];

        blobs = await Promise.all(fonts.map(async (entry) => {
          const { content } = await entry.getContent(binaryLoader);
          return Buffer.from(content as Uint8Array);
        }));
      }

      const src: Entry[] = Array.from(site.fs.entries.values())
        .filter((entry) => entry.path.endsWith(".typ"));
      const sources: [string, string][] = await Promise.all(
        src.map(async (entry) => {
          const { content } = await entry.getContent(textLoader);
          return [
            entry.path,
            content as string,
          ];
        }),
      );

      engine.initCompiler(blobs, sources);
    });

    site.filter(
      "typst",
      ((content: string, data: Record<string, string> = {}) =>
        engine.render(content, data)) as Helper,
      true,
    );

    site.hooks.typst = (cb: (engine: TypstEngine) => void) => cb(engine);
  };
}

export default typst;

declare global {
  namespace Lume {
    export interface Hooks {
      typst?: (callback: (engine: TypstEngine) => void) => void;
    }
    export interface Helpers {
      typst: (
        content: string,
        data?: Record<string, unknown>,
      ) => Promise<string | Uint8Array>;
    }
  }
}
