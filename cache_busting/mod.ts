import type { Page, Plugin, Site } from "lume/core.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { merge } from "lume/core/utils.ts";
import type { Element } from "lume/deps/dom.ts";
import { posix } from "lume/deps/path.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Attribute used to select the elements this plugin applies to */
  attribute: string;

  /** The algorithm used to calculate file hashes */
  algorithm: "sha256" | "sha384" | "sha512";

  /** The length of file hashes to generate */
  hashLength: number;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  attribute: "hash",
  algorithm: "sha384",
  hashLength: 10,
};

const cache = new Map<string, string>();

/**
 * A plugin to add cache-busting hashes to the filenames of HTML sub-resources.
 */
export default function (userOptions?: Partial<Options>): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const selector = `[${options.attribute}]`;

    site.process(options.extensions, async (page: Page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      const nodes = document.querySelectorAll(selector);

      for (const node of nodes) {
        const element = node as Element;

        // TODO what other attributes do we want to support?
        //   link: ['href']
        //   video: ['src', 'poster']
        //   source: ['src', 'srcset']
        //   img: ['src', 'srcset']
        //   image: ['xlink:href', 'href']
        //   use: ['xlink:href', 'href']
        if (element.hasAttribute("src")) {
          await hashSrc(element);
        }

        if (element.hasAttribute("href")) {
          await hashHref(element);
        }

        element.removeAttribute(options.attribute);
      }

      async function hashHref(element: Element) {
        const url = element.getAttribute("href")!;

        const hash = await getHash(options.algorithm, url);

        // TODO Better handling of query string parameters
        // Here I'm assuming there aren't already query string parameters
        // I'm sure there's a better approach, perhaps using
        // `new URL(href, site.options.location)`
        const urlWithHash = `${url}?v=${hash}`;

        element.setAttribute("href", urlWithHash);
      }

      async function hashSrc(element: Element) {
        const url = element.getAttribute("src")!;

        const hash = await getHash(options.algorithm, url);

        // TODO Better handling of query string parameters
        // Here I'm assuming there aren't already query string parameters
        // I'm sure there's a better approach, perhaps using
        // `new URL(href, site.options.location)`
        const urlWithHash = `${url}?v=${hash}`;

        element.setAttribute("src", urlWithHash);
      }
    });

    // TODO what hash algorithms do we want to support?
    async function getHash(
      algorithm: Options["algorithm"],
      url: string
    ) {
      // Ensure the path starts with "/"
      url = posix.join("/", url);

      if (cache.has(url)) {
        return cache.get(url)!;
      }
    
      const data = await getFileContent(url);
      // TODO I initially used the following, from the SRI plugin.
      // I'm not sure why this doesn't work.
      // const data = await read(url, true);
      const hashBuffer = await crypto.subtle.digest(digestName(algorithm), data);
      const hash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
      cache.set(url, hash);
      return hash.substring(0, options.hashLength);
    }
    
    function digestName(algorithm: Options["algorithm"]) {
      switch (algorithm) {
        case "sha256":
          return "SHA-256";
        case "sha384":
          return "SHA-384";
        case "sha512":
          return "SHA-512";
        default:
          return "SHA-384";
      }
    }

    async function getFileContent(url: string,): Promise<Uint8Array> {
      const content = await site.getContent(url, binaryLoader);

      if (!content) {
        throw new Error(`Unable to find the file "${url}"`);
      }

      return content as Uint8Array;
    }
  };
}
