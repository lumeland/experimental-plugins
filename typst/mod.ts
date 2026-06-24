import textLoader from "lume/core/loaders/text.ts";
import loadBinary from "lume/core/loaders/binary.ts";
import { merge } from "lume/core/utils/object.ts";
import { normalizePath } from "lume/core/utils/path.ts";
import { log } from "lume/core/utils/log.ts";
import { posix } from "lume/deps/path.ts";

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

const FONT_EXTS = new Set([".woff2", ".woff", ".ttf", ".otf"]);

type FsEntry = NonNullable<ReturnType<Site["fs"]["entries"]["get"]>>;

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
  pageSubExtension?: string; // <-- 1. Add '?' to make this optional
  /** Global Typst inputs, exposed as `sys.inputs`. */
  inputs?: Record<string, string>;
  /**
   * Font files or folders available in Lume's virtual filesystem.
   *
   * Remote fonts should be added with `site.remoteFile()`.
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

// 2. Explicitly type defaults as `Options` instead of using `satisfies Options`
export const defaults: Options = {
  extensions: [".typ"],
  inputs: {},
  fonts: [],
  prelude: "",
  pdf: {},
};

type ResolvedOptions = Omit<Required<Options>, "pageSubExtension"> & {
  pageSubExtension?: string;
};

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
    const fontBlobs = await this.#collectFontBlobs();

    return NodeCompiler.create({
      workspace: this.#site.src(),
      fontArgs: [{ fontBlobs }],
    });
  }

  /*
   * Resolves every `options.fonts` entry (file or folder) through
   * `site.fs.entries`, so local and `site.remoteFile()`-mapped fonts are
   * treated identically.
   */
  async #collectFontBlobs(): Promise<Buffer[]> {
    const blobs: Buffer[] = [];
    const loaded = new Set<string>();
    const { entries } = this.#site.fs;

    const loadEntry = async (path: string, entry: FsEntry) => {
      if (loaded.has(path)) return;
      loaded.add(path);
      try {
        const { content } = await entry.getContent(loadBinary);
        blobs.push(Buffer.from(content as Uint8Array));
      } catch (error) {
        log.error(`[typst plugin] Unable to load font "${path}": ${error}`);
      }
    };

    for (const font of this.#options.fonts) {
      const path = normalizePath(posix.join("/", font));
      const prefix = path.endsWith("/") ? path : `${path}/`;
      let found = false;

      // 1. Check dynamically generated Lume pages/files (e.g., from google_fonts)
      for (const file of [...this.#site.pages, ...this.#site.files]) {
        const url = file.data.url as string | undefined;
        if (
          url &&
          (url === path || url.startsWith(prefix)) &&
          FONT_EXTS.has(posix.extname(url))
        ) {
          if (file.content instanceof Uint8Array && !loaded.has(url)) {
            blobs.push(Buffer.from(file.content));
            loaded.add(url);
            found = true;
          }
        }
      }

      // 2. Check Lume's virtual filesystem (local source files & site.remoteFile)
      const entry = entries.get(path);
      if (entry?.type === "file") {
        await loadEntry(path, entry);
        continue;
      }

      for (const [entryPath, childEntry] of entries) {
        if (
          childEntry.type !== "file" ||
          !entryPath.startsWith(prefix) ||
          !FONT_EXTS.has(posix.extname(entryPath))
        ) {
          continue;
        }
        found = true;
        await loadEntry(entryPath, childEntry);
      }

      if (!entry && !found) {
        // Downgrade to a warning, as plugins like google_fonts might not
        // have generated the fonts on the very first initialization pass
        log.warn(
          `[typst plugin] Font path "${font}" was not found in source or generated files.`,
        );
      }
    }

    return blobs;
  }

  /** async access to the underlying compiler */
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

export function typst(userOptions?: Options) {
  const options = merge(
    defaults,
    userOptions,
  ) as ResolvedOptions;

  return (site: Site) => {
    const engine = new TypstEngine(site, options);

    site.loadPages(options.extensions, {
      loader: textLoader,
      engine,
      pageSubExtension: options.pageSubExtension,
    });

    // Handles pages with `outputs: ["html", "pdf", "svg"]` in their data.
    site.preprocess(
      options.extensions,
      function processTypstOutputs(pages, allPages) {
        for (const page of [...pages]) {
          const outputs = page.data.outputs as OutputFormat[] | undefined;
          if (!Array.isArray(outputs) || outputs.length === 0) {
            continue;
          }

          const outputPath = page.outputPath;
          const baseUrl = outputPath === "/index.html"
            ? "/index"
            : outputPath.replace(/(\/index)?\.html$/, "");

          const newPages = outputs.map((format, i) => {
            const isHtml = format === "html";

            return page.duplicate(i, {
              ...page.data,
              outputs: undefined,
              layout: isHtml ? page.data.layout : undefined,
              url: isHtml ? page.data.url : `${baseUrl}.${format}`,
              type: isHtml ? page.data.type : format,
            });
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
