import engine from "https://deno.land/x/vento@v0.4.0/mod.ts";
import { FileLoader } from "https://deno.land/x/vento@v0.4.0/src/loader.ts";
import loader from "lume/core/loaders/text.ts";
import { merge, normalizePath } from "lume/core/utils.ts";

import type { Environment } from "https://deno.land/x/vento@v0.4.0/src/environment.ts";
import type { Data, Engine, FS, Helper, Site } from "lume/core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".vento", ".vto"],
};

class LumeLoader extends FileLoader {
  fs: FS;

  constructor(includes: string, fs: FS) {
    super(includes);
    this.fs = fs;
  }

  async load(file: string) {
    const entry = this.fs.entries.get(file);

    if (!entry) {
      throw new Error(`File not found: ${file}`);
    }

    const data = await entry.getContent(loader);

    return {
      source: data.content as string,
      data: data,
    };
  }
}

/** Template engine to render JSX files using NanoJSX */
export class VentoEngine implements Engine {
  engine: Environment;

  constructor(site: Site) {
    this.engine = engine({
      includes: new LumeLoader(normalizePath(site.options.includes), site.fs),
    });
  }

  deleteCache(file: string) {
    this.engine.cache.delete(file);
  }

  render(content: string, data: Data = {}, filename?: string) {
    return this.engine.runString(content, data, filename);
  }

  renderSync(): string {
    throw new Error("Not implemented");
  }

  addHelper(name: string, fn: Helper) {
    this.engine.filters[name] = fn;
  }
}

/** Register the plugin to support Vento files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, components: options.extensions }
    : options.extensions;

  return (site: Site) => {
    const engine = new VentoEngine(site);

    site.loadPages(extensions.pages, loader, engine);
    site.loadComponents(extensions.components, loader, engine);
  };
}
