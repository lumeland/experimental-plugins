import { Exception, merge } from "lume/core/utils.ts";
import { Page, Site } from "lume/core.ts";
import { minify as rawMinify, minifyHTML, MinifyHTMLOptions } from "./deps.ts";

export interface Options {
  /** Set `true` to include the style reset */
  extensions: string[];
  htmlOptions: Partial<MinifyHTMLOptions>;
}

const defaults: Options = {
  extensions: [".html"],
  htmlOptions: {
    minifyCSS: false,
    minifyJS: false,
  },
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, minify);

    function minify(page: Page) {
      const content = page.content as string;
      const language = page.dest.ext.slice(1);

      switch (language) {
        case "html":
          page.content = minifyHTML(content, options.htmlOptions);
          return;

        case "css":
        case "js":
        case "json": {
          page.content = rawMinify(language, content);
          return;
        }

        default:
          throw new Exception("Unsupported file type", { page });
      }
    }
  };
}
