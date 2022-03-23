import Prism, { loadLanguages } from "./deps.ts";
import { merge } from "lume/core/utils.ts";

import type { Page, Site } from "lume/core.ts";
import type { Element } from "lume/deps/dom.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];
  /** The css selector to apply prism */
  cssSelector: string;
  /** The list of programing languages to load */
  languages: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  cssSelector: "pre code",
  languages: [],
};

/** A plugin to syntax-highlight code using the prism library */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeBuild", async () => {
      const languages = await loadLanguages(options.languages);

      for (const [language, data] of Object.entries(languages)) {
        Prism.languages[language] = data;
      }
    });
    site.process(options.extensions, prism);

    function prism(page: Page) {
      page.document!.querySelectorAll(options.cssSelector!)
        .forEach((element) => Prism.highlightElement(element as Element));
    }
  };
}
