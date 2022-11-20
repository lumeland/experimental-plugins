import { merge } from "lume/core/utils.ts";

import type { Page, Site } from "lume/core.ts";

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The words per minute a reader can read (default: 275) */
  wordsPerMinute: number;
}

export const defaults: Options = {
  extensions: [".md"],
  wordsPerMinute: 275,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, readingTime);

    function readingTime(page: Page) {
      const content = page.data.content as string;

      if (!content || typeof content !== "string") {
        page.data.readingTime = {
          words: 0,
          minutes: 0,
          time: 0,
        };
      }

      const matches = content.match(/\w+/g);

      const wordCount = matches ? matches.length : 0;
      const minutes = wordCount / options.wordsPerMinute;

      const time = Math.round(minutes * 60 * 1000);
      const displayTime = Math.ceil(parseFloat(minutes.toFixed(2)));

      page.data.readingTime = {
        words: wordCount,
        minutes: displayTime,
        time,
      };
    }
  };
}
