import { merge } from "lume/core/utils.ts";
import { relative } from "lume/deps/path.ts";
import * as esbuild from "./deps.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** The options for esbuild */
  options: esbuild.BuildOptions;
}

// Default options
const defaults: Options = {
  extensions: [".ts", ".js"],
  options: {
    bundle: true,
    format: "esm",
    minify: true,
    keepNames: true,
    platform: "browser",
    target: "esnext",
    incremental: true,
    treeShaking: true,
  },
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);

    site.addEventListener("beforeSave", () => esbuild.stop());

    site.process(options.extensions, async (page) => {
      const name = `${page.src.path}${page.src.ext}`;
      const filename = relative(site.options.cwd, site.src(name));
      console.log("📦", name);

      const buildOptions: esbuild.BuildOptions = {
        ...options.options,
        write: false,
        incremental: false,
        watch: false,
        metafile: false,
        entryPoints: [filename],
      };

      const { outputFiles, warnings, errors } = await esbuild.build(
        buildOptions,
      );

      if (errors.length) {
        site.logger.warn("esbuild errors", { errors });
      }

      if (warnings.length) {
        site.logger.warn("esbuild warnings", { warnings });
      }

      if (outputFiles?.length) {
        page.content = outputFiles[0].contents;
      }
    });
  };
}
