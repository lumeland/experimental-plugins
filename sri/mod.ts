import { merge, read } from "lume/core/utils.ts";
import type { Element } from "lume/deps/dom.ts";
import type { Plugin, Site } from "lume/core.ts";

export interface Options {
  /** The algorithm used to calculate the cryptographic hash of the file */
  algorithm: "sha256" | "sha384" | "sha512";

  /** The CORS setting for the file being loaded */
  crossorigin: "anonymous" | "use-credentials";
}

export const defaults: Options = {
  algorithm: "sha384",
  crossorigin: "anonymous",
};

const cache = new Map<string, string>();

export default function (userOptions: Partial<Options>): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const { origin } = site.options.location;

    site.process([".html"], async (page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      const nodes = document.querySelectorAll(
        "script[src], link[rel=stylesheet][href]",
      );

      for (const node of nodes) {
        const element = node as Element;
        const url = element.getAttribute("src") || element.getAttribute("href");

        if (!url || !url.match(/^https?:\/\//) || url.startsWith(origin)) {
          continue;
        }

        const integrity = await getIntegrity(options.algorithm, url);
        element.setAttribute("integrity", integrity);
        element.setAttribute("crossorigin", options.crossorigin);
      }
    });
  };
}

async function getIntegrity(algorithm: Options["algorithm"], url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const data = await read(url, true);
  const hashBuffer = await crypto.subtle.digest(digestName(algorithm), data);
  const base64string = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  const integrity = `sha384-${base64string}`;
  cache.set(url, integrity);
  return integrity;
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
