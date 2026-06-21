import textLoader from "lume/core/loaders/text.ts";
import { merge } from "lume/core/utils/object.ts";
import { log } from "lume/core/utils/log.ts";
import { read } from "lume/core/utils/read.ts";
import { isUrl } from "lume/core/utils/path.ts";

import type Site from "lume/core/site.ts";
import type { Page } from "lume/core/file.ts";
import type { Engine, Helper, HelperOptions } from "lume/core/renderer.ts";

// Import types from deps.ts for TypeScript safety
import type {
  CompileDocArgs,
  NodeCompiler as NodeCompilerType,
  RenderPdfOpts,
} from "./deps.ts";

import { NodeCompiler } from "./deps.ts";

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

export interface Options {
  /**
   * File extensions this plugin should handle.
   * @default [".typ"]
   */
  extensions?: string[];
  /** Page sub-extension, e.g. `.page` for `file.page.typ`. */
  pageSubExtension?: string;
  /**
   * Pre-process `.typ` files with Vento first, so `{{ }}` placeholders are
   * resolved before Typst sees the source. Disable this if your documents
   * legitimately produce literal `{{ }}` sequences (e.g. adjacent nested
   * Typst code blocks).
   * @default true
   */
  useVento?: boolean;
  /** Global Typst inputs, exposed as `sys.inputs`. */
  inputs?: Record<string, string>;
  /**
   * Extra directories where Typst should search for fonts. These are
   * native filesystem paths consumed directly by the compiler; relative
   * paths are resolved against the site's `src` folder.
   */
  fontPaths?: string[];
  /**
   * Explicit font files to load, as paths (relative to `src`) or remote
   * specifiers (`https://`, `npm:`, `gh:`, `jsr:`). Use this to embed
   * fonts without relying on OS font directories.
   */
  fonts?: string[];
  /**
   * Typst code injected before every document — the place to put shared
   * `#set`/`#show` rules. Receives the resolved output format, so styling
   * can vary per target if you want (`sys.inputs.at("x-target")` is also
   * available from inside the document itself).
   */
  prelude?:
    | string
    | ((format: OutputFormat, page?: Page) => string | Promise<string>);
  /** Options used when exporting to PDF. */
  pdf?: PdfOptions;
}

export const defaults = {
  extensions: [".typ"],
  useVento: true,
  inputs: {},
  fontPaths: [],
  fonts: [],
  prelude: "",
  pdf: {},
} satisfies Options;

type ResolvedOptions = Merge<Options, typeof defaults>;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class TypstEngine implements Engine {
  readonly #site: Site;
  readonly #options: ResolvedOptions;
  #compiler: Promise<NodeCompilerType> | null = null;

  constructor(site: Site, options: ResolvedOptions) {
    this.#site = site;
    this.#options = options;
  }

  async #getCompiler(): Promise<NodeCompilerType> {
    this.#compiler ??= this.#createCompiler();
    return this.#compiler;
  }

  async #createCompiler(): Promise<NodeCompilerType> {
    const fontPaths = this.#options.fontPaths.map((path) =>
      isUrl(path) || path.startsWith("/") ? path : this.#site.src(path)
    );

    const localFonts = this.#site.src("_fonts");
    try {
      if (Deno.statSync(localFonts).isDirectory) {
        fontPaths.push(localFonts);
      }
    } catch {
      // Ignore
    }

    const fontBlobs = await this.#loadFontBlobs();

    return NodeCompiler.create({
      workspace: this.#site.src(),
      fontArgs: [{ fontBlobs }, { fontPaths }],
    });
  }

  async #loadFontBlobs(): Promise<Uint8Array[]> {
    const blobs: Uint8Array[] = [];

    for (const font of this.#options.fonts) {
      const path = isUrl(font) ? font : this.#site.src(font);
      try {
        blobs.push((await read(path, true)) as Uint8Array);
      } catch (error) {
        log.error(`[typst plugin] Unable to load font "${font}": ${error}`);
      }
    }

    const fontsFolder = (this.#site.options as Record<string, unknown>)
      .fontsFolder as string | undefined;

    if (fontsFolder) {
      for (const page of this.#site.pages) {
        const url = page.data.url as string | undefined;
        if (
          url?.startsWith(fontsFolder) && page.content instanceof Uint8Array
        ) {
          blobs.push(page.content);
        }
      }
    }

    return blobs;
  }

  getCompiler(): Promise<NodeCompilerType> {
    return this.#getCompiler();
  }

  deleteCache(): void {
    this.#compiler = null;
  }

  #format(url = ""): OutputFormat {
    if (url.endsWith(".pdf")) return "pdf";
    if (url.endsWith(".svg")) return "svg";
    return "html";
  }

  async render(
    content: unknown,
    data?: Record<string, unknown>,
    filename?: string,
  ): Promise<string | Uint8Array> {
    const compiler = await this.#getCompiler();
    const url = data?.url as string | undefined;
    const format = this.#format(url);
    const page = data?.page as Page | undefined;

    const inputs: Record<string, string> = {
      ...this.#options.inputs,
      "x-target": format,
      lume: JSON.stringify({
        url,
        title: data?.title,
        description: data?.description,
        date: data?.date,
        tags: data?.tags,
        lang: data?.lang,
      }),
    };

    let src = String(content);

    const prelude = typeof this.#options.prelude === "function"
      ? await this.#options.prelude(format, page)
      : this.#options.prelude;

    if (prelude) {
      src = `${prelude}\n${src}`;
    }

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
      switch (format) {
        case "svg":
          return new TextEncoder().encode(compiler.svg(compileArgs));
        case "pdf": {
          const pdfOpts: RenderPdfOpts | undefined =
            this.#options.pdf && Object.keys(this.#options.pdf).length > 0
              ? {
                pdfStandard: this.#options.pdf.standard,
                pdfTags: this.#options.pdf.tags,
                creationTimestamp: this.#options.pdf.creationTimestamp,
              }
              : undefined;
          return compiler.pdf(compileArgs, pdfOpts);
        }
        default: {
          const result = await compiler.tryHtml(compileArgs);
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

  addHelper(_name: string, _fn: Helper, _options: HelperOptions): void {}
}

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------

export function typst(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const engine = new TypstEngine(site, options);
    const engineName = options.extensions[0].replace(/^\./, "");

    site.loadPages(options.extensions, {
      loader: textLoader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });

    if (options.useVento) {
      site.preprocess(
        options.extensions,
        function setTypstTemplateEngine(pages) {
          for (const page of pages) {
            page.data.templateEngine ??= ["vto", engineName];
          }
        },
      );
    }

    site.preprocess(
      options.extensions,
      function processTypstOutputs(pages, allPages) {
        for (const page of [...pages]) {
          const outputs = page.data.outputs as OutputFormat[] | undefined;
          if (!Array.isArray(outputs) || outputs.length === 0) {
            continue;
          }

          const url = page.data.url as string;
          const baseUrl = url.endsWith("/")
            ? url.slice(0, -1)
            : url.replace(/\.html$/, "");

          const newPages = outputs.map((format, i) => {
            const isHtml = format === "html";

            const newPage = page.duplicate(i, {
              ...page.data,
              outputs: undefined,
              layout: isHtml ? page.data.layout : undefined,
              url: isHtml ? url : `${baseUrl}.${format}`,
            });

            if (!isHtml) {
              newPage.data.type = format;
              newPage.data.index = false;
              newPage.data.metas = false;
              newPage.data.seo = false;
            }
            return newPage;
          });

          const index = allPages.indexOf(page);
          if (index !== -1) {
            allPages.splice(index, 1, ...newPages);
          }
        }
      },
    );

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
    export interface Data {
      outputs?: OutputFormat[];
    }
  }
}
