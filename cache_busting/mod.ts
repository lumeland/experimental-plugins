import { getPathAndExtension } from "lume/core/utils/path.ts";
import { merge } from "lume/core/utils/object.ts";
import { encodeHex } from "lume/deps/hex.ts";
import { posix } from "lume/deps/path.ts";
import modifyUrls from "lume/plugins/modify_urls.ts";

import "lume/types.ts";

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

const cache = new Map<string, Promise<string>>();

/** A plugin to add cache busting hashes to all URLs found in HTML documents. */
export default function (userOptions?: Partial<Options>): Lume.Plugin {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    const selector = `[${options.attribute}]`;

    site.use(modifyUrls({ fn: replace }));

    async function replace(
      url: string | null,
      page: Lume.Page,
      element?: Element,
    ) {
      if (url && element?.matches(selector)) {
        return await addHash(url, page);
      }

      return "";
    }

    async function addHash(url: string, page: Lume.Page) {
      // Resolve relative URLs
      if (page.data.url && url.startsWith(".")) {
        url = posix.join(page.data.url, url);
      }

      // Ensure the path starts with "/"
      url = posix.join("/", url);

      if (!cache.has(url)) {
        cache.set(url, getHash(url));
      }

      const hash = await cache.get(url)!;

      const [path, ext] = getPathAndExtension(url);

      return `${path}-${hash}${ext}`;
    }

    async function getHash(url: string) {
      const content = await getFileContent(url);

      const contentHash = await getContentHash(content);

      renameFile(url, contentHash);

      return contentHash;
    }

    async function getFileContent(url: string): Promise<Uint8Array> {
      const content = await site.getContent(url, true);

      if (!content) {
        throw new Error(`Unable to find the file "${url}"`);
      }

      return content as Uint8Array;
    }

    function renameFile(url: string, hash: string) {
      // It's a page or static file
      const file = site.pages.find((page) => page.data.url === url)
        ?? site.files.find((file) => file.data.url === url)

      if (file) {
        const [path, ext] = getPathAndExtension(url);
        file.data.url = `${path}-${hash}${ext}`;
        return;
      }

      throw new Error(`Unable to find the file "${url}"`);
    }

    async function getContentHash(content: Uint8Array): Promise<string> {
      const hashBuffer = await crypto.subtle.digest("SHA-1", content);
      const hash = encodeHex(new Uint8Array(hashBuffer));
      return hash.substring(0, options.hashLength);
    }
  };
}
