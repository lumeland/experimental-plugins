import binaryLoader from "lume/core/loaders/binary.ts";
import { merge } from "lume/core/utils.ts";
import { encode } from "lume/deps/hex.ts";
import { posix } from "lume/deps/path.ts";
import modifyUrls from "lume/plugins/modify_urls.ts";

import type { Page, Plugin, Site } from "lume/core.ts";
import type { Element } from "lume/deps/dom.ts";

export interface Options {
  /** Attribute used to select the elements this plugin applies to */
  attribute: string;

  /** The length of file hashes to generate */
  hashLength: number;
}

// Default options
export const defaults: Options = {
  attribute: "hash",
  hashLength: 10,
};

const cache = new Map<string, string>();

/** A plugin to add cache busting hashes to all URLs found in HTML documents. */
export default function (userOptions?: Partial<Options>): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const selector = `[${options.attribute}]`

    site.use(modifyUrls({ fn: replace }));

    async function replace(url: string | null, _: Page, element: Element) {
      if (url && element.matches(selector)) {
        return await addHash(url);
      }
  
      return "";
    }

    async function addHash(url: string) {
      let hash = await getHash(url);
      hash = hash.substring(0, options.hashLength);

      if (url.includes("?")) {
        const [path, rest] = url.split("?", 2);
        return `${path}?v=${hash}&${rest}`
      }

      return `${url}?v=${hash}`;
    }

    async function getHash(url: string) {
      // Ensure the path starts with "/"
      url = posix.join("/", url);

      if (!cache.has(url)) {
        const content = await getFileContent(url);
        cache.set(url, await hash(content));
      }

      return cache.get(url)!;
    }

    async function getFileContent(url: string,): Promise<Uint8Array> {
      const content = await site.getContent(url, binaryLoader);

      if (!content) {
        throw new Error(`Unable to find the file "${url}"`);
      }

      return content as Uint8Array;
    }

    async function hash(content: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest("SHA-1", content);
      const hex = encode(new Uint8Array(hash));
      return new TextDecoder().decode(hex);
    }
  };
}
