import textLoader from "lume/core/loaders/text.ts";
import loadBinary from "lume/core/loaders/binary.ts";
import { merge } from "lume/core/utils/object.ts";
import { log } from "lume/core/utils/log.ts";

import type { Entry } from "lume/core/fs.ts";
import type Site from "lume/core/site.ts";
import type { Page } from "lume/core/file.ts";
import type { Engine, Helper } from "lume/core/renderer.ts";

// Import types from deps.ts for TypeScript safety
import type {
  CompileDocArgs,
  NodeCompiler as NodeCompilerType,
  RenderPdfOpts,
} from "./deps.ts";

import { NodeCompiler } from "./deps.ts";
import { Data } from "lume/types.ts";

/** The output formats this plugin can compile a `.typ` file to. */
export type OutputFormat = "html" | "svg" | "pdf";

export interface PdfOptions {
  /** The PDF standard to target, e.g. `"1.7"` or `"a-2b"`. */
  standard?: string;
  /** Whether to write a tagged (accessible) PDF. @default true */
  tags?: boolean;
  /** A fixed creation timestamp, in seconds since the epoch. */
  creationTimestamp?: number;
}

export type SvgMode = "plain" | "rich";

export interface SvgOptions {
  /**
   * "plain" flattens text/images into a fully self-contained SVG — required
   * for static rasterizers (resvg, Sharp/librsvg, ImageMagick). "rich" emits
   * Typst's deduplicated/optimized SVG — smaller for text-heavy docs, but
   * only safe when the consumer is a real browser engine.
   * @default "plain"
   */
  mode?: SvgMode;
}

export interface Options {
  /**
   * File extensions this plugin should handle.
   * @default [".typ"]
   */
  extensions?: string[];
  /** Page sub-extension, e.g. `.page` for `file.page.typ`. */
  pageSubExtension?: string; // <-- 1. Add '?' to make this optional
  /** Options used when exporting to PDF. */
  pdf?: PdfOptions;
  /** Options used when exporting to SVG. */
  svg?: SvgOptions;
}

// 2. Explicitly type defaults as `Options` instead of using `satisfies Options`
export const defaults: Options = {
  extensions: [".typ"],
  pdf: {},
  svg: { mode: "plain" },
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

  initCompiler(fontBlobs: Buffer[]) {
    if (!this.#compiler) {
      this.#compiler = NodeCompiler.create({
        workspace: this.#site.src(),
        fontArgs: [{ fontBlobs }],
      });
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

  #format(url = ""): OutputFormat {
    if (url.endsWith(".pdf")) return "pdf";
    if (url.endsWith(".svg")) return "svg";
    return "html";
  }

  async render(
    content: unknown,
    data: Data,
    filename?: string,
  ): Promise<string | Uint8Array> {
    const compiler = this.#getCompiler();
    const url = data.url as string;
    const format = this.#format(url);
    const page = data?.page as Page | undefined;

    const inputs: Record<string, string> = {
      "x-target": format,
      ...Object.fromEntries(
        Object.entries(data).filter(([, value]) =>
          typeof value === "string" || typeof value === "number"
        ),
      ),
    };

    const src = String(content);

    if (data && format !== "html" && data.layout) {
      data.layout = undefined;
    }

    const sourcePath = page?.sourcePath;
    let mainFilePath: string | undefined;

    if (
      sourcePath &&
      this.#options.extensions.some((ext) => sourcePath.endsWith(ext))
    ) {
      mainFilePath = this.#site.src(sourcePath);
      try {
        compiler.addSource(mainFilePath, src);
      } catch (error) {
        log.warn(
          `[typst plugin] Unable to register source ${sourcePath}: ${error}`,
        );
      }
    }

    const compileArgs: CompileDocArgs = {
      inputs,
      ...(mainFilePath ? { mainFilePath } : { mainFileContent: src }),
    };

    try {
      console.log(compileArgs);
      switch (format) {
        case "svg": {
          const mode = this.#options.svg?.mode ?? "plain";
          return mode === "rich"
            ? compiler.svg(compileArgs)
            : compiler.plainSvg(compileArgs);
        }
        case "pdf": {
          try {
            const pdfOpts: RenderPdfOpts | undefined =
              this.#options.pdf && Object.keys(this.#options.pdf).length > 0
                ? {
                  pdfStandard: this.#options.pdf.standard,
                  pdfTags: this.#options.pdf.tags,
                  creationTimestamp: this.#options.pdf.creationTimestamp,
                }
                : undefined;
            return compiler.pdf(compileArgs, pdfOpts);
          } catch (err) {
            console.error(err);
            break;
          }
        }
        default: {
          const result = compiler.tryHtml(compileArgs);
          if (result.hasError()) {
            result.printErrors();
            throw new Error(
              `[typst plugin] HTML compilation failed for ${
                url ?? filename ?? "unknown"
              }`,
            );
          }
          const output = result.result!;
          if (data) {
            data.title ??= output.title();
            data.description ??= output.description();
          }
          return output.body();
        }
      }
    } catch (error) {
      log.error(
        `[typst plugin] Failed to compile ${
          url ?? filename ?? "unknown"
        } (${format}): ${error}`,
      );
      throw error;
    }
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

    site.loadPages(options.extensions, {
      loader: textLoader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });

    site.addEventListener("beforeRender", async (event) => {
      // Load all fonts added to Lume
      if (!blobs) {
        const fontsExtensions = new Set([".woff2", ".woff", ".ttf", ".otf"]);
        const entries: Entry[] = [
          ...event.pages
            .filter((page) => fontsExtensions.has(page.src.ext))
            .map((page) => page.src.entry)
            .filter((entry) => entry !== undefined),
          ...site.files
            .filter((file) => fontsExtensions.has(file.src.ext))
            .map((file) => file.src.entry)
            .filter((entry) => entry !== undefined),
        ];

        blobs = await Promise.all(entries.map(async (entry) => {
          const { content } = await entry.getContent(loadBinary);
          return Buffer.from(content as Uint8Array);
        }));
      }

      engine.initCompiler(blobs);
    });

    site.filter(
      "typst",
      ((content: string, data?: Record<string, unknown>) =>
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
