import { merge } from "lume/core/utils.ts";
import { posix } from "lume/deps/path.ts";
import { downloadBinary } from "./deps.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  binary: string;
  ui: {
    /** The container id to insert the search */
    containerId: string;

    /** Whether to show an image alongside each search result. */
    showImages: boolean;

    /**
     * By default, Pagefind UI shows filters with no results alongside the count (0).
     * Pass false to hide filters that have no remaining results.
     */
    showEmptyFilters: boolean;

    /**
     * By default, Pagefind UI applies a CSS reset to itself.
     * Pass false to omit this and inherit from your site styles.
     */
    resetStyles: boolean;
  } | false;

  indexing: {
    /** The folder to output search files into, relative to source. */
    bundleDirectory: string;

    /** The element that Pagefind should treat as the root of the document. */
    rootSelector: string;

    /** Configures the glob used by Pagefind to discover HTML files. */
    glob: string;

    /** Ignores any detected languages and creates a single index for the entire site as the provided language. */
    forceLanguage: string | false;

    /** Prints extra logging while indexing the site. */
    verbose: boolean;
  };
}

const defaults: Options = {
  binary: "./_bin/pagefind",
  ui: {
    containerId: "search",
    showImages: false,
    showEmptyFilters: true,
    resetStyles: true,
  },
  indexing: {
    bundleDirectory: "pagefind",
    rootSelector: "html",
    glob: "**/*.html",
    forceLanguage: false,
    verbose: false,
  },
};

/** A plugin to generate a static full text search engine */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const { ui, indexing } = options;

    if (ui) {
      site.process([".html"], (page) => {
        const container = page.document?.getElementById(ui.containerId);
        const uiSettings = {
          element: `#${ui.containerId}`,
          showImages: ui.showImages,
          showEmptyFilters: ui.showEmptyFilters,
          resetStyles: ui.resetStyles,
          bundlePath: site.url(posix.join(indexing.bundleDirectory, "/")),
          baseUrl: site.url("/"),
        };

        // Insert UI styles and scripts
        if (container) {
          const styles = page.document!.createElement("link");
          styles.setAttribute("rel", "stylesheet");
          styles.setAttribute(
            "href",
            site.url(
              `${posix.join(indexing.bundleDirectory, "pagefind-ui.css")}`,
            ),
          );

          const script = page.document!.createElement("script");
          script.setAttribute("type", "text/javascript");
          script.setAttribute(
            "src",
            site.url(
              `${posix.join(indexing.bundleDirectory, "pagefind-ui.js")}`,
            ),
          );

          const init = page.document!.createElement("script");
          init.setAttribute("type", "text/javascript");
          init.innerHTML =
            `window.addEventListener('DOMContentLoaded', () => { new PagefindUI(${
              JSON.stringify(uiSettings)
            }); });`;
          page.document!.head.append(styles, script, init);
        }
      });
    }

    site.addEventListener("afterBuild", async () => {
      const binary = await downloadBinary(options.binary);
      const { code, stdout, stderr } = await Deno.spawn(
        binary,
        {
          args: buildArgs(options.indexing, site.dest()),
        },
      );
      console.log({ binary, code });
      console.log(new TextDecoder().decode(stdout));
      console.log(new TextDecoder().decode(stderr));
    });
  };
}

function buildArgs(
  options: Options["indexing"],
  source: string,
): string[] {
  const args = [
    "--source",
    source,
    "--bundle-dir",
    options.bundleDirectory,
    "--root-selector",
    options.rootSelector,
    "--glob",
    options.glob,
  ];

  if (options.forceLanguage) {
    args.push("--force-language", options.forceLanguage);
  }

  if (options.verbose) {
    args.push("--verbose");
  }

  return args;
}
