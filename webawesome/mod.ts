import { merge } from "lume/core/utils/object.ts";
import Site from "lume/core/site.ts";
import { posix } from "lume/deps/path.ts";

const specifier = "npm:@awesome.me/webawesome@3.7.0/dist-cdn";

export interface Options {
  outputPath?: string;
}

export const defaults: Options = {
  outputPath: "webawesome",
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const { outputPath } = options;

  return (site: Site) => {
    // Copy all assets
    site.copy(`${specifier}/**/*{.js,.css}`, outputPath);

    site.process([".html"], (pages) => {
      for (const page of pages) {
        const { document } = page;

        const styles = document.createElement("link");
        styles.setAttribute("rel", "stylesheet");
        styles.setAttribute(
          "href",
          site.url(
            `${posix.join(options.outputPath, "styles/webawesome.css")}`,
          ),
        );

        // Insert before other styles to allow overriding
        const first = document.head.querySelector(
          "link[rel=stylesheet],style",
        );
        if (first) {
          document.head.insertBefore(styles, first);
        } else {
          document.head.append(styles);
        }

        const script = document.createElement("script");
        script.setAttribute("type", "module");
        script.setAttribute(
          "src",
          site.url(
            `${posix.join(options.outputPath, "webawesome.loader.js")}`,
          ),
        );
        document.head.append(script);
      }
    });
  };
}
