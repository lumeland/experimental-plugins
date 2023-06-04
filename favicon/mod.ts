import { DeepPartial, merge } from "lume/core/utils.ts";
import binLoader from "lume/core/loaders/binary.ts";
import {
  ImageMagick,
  initialize,
  MagickFormat,
  MagickGeometry,
} from "lume/deps/imagick.ts";
import { Page } from "lume/core/filesystem.ts";
import Cache from "lume/core/cache.ts";

import type { Document } from "lume/deps/dom.ts";
import type { Plugin, Site } from "lume/core.ts";
import type { IMagickImage } from "lume/deps/imagick.ts";

await initialize();

export interface Options {
  /** The input PNG file to generate the favicons */
  input: string;

  /** The cache folder */
  cache: string | boolean;
}

export const defaults: Options = {
  input: "/favicon.png",
  cache: true,
};

export default function (userOptions: DeepPartial<Options> = {}): Plugin {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Configure the cache folder
    const cacheFolder = options.cache === true ? "_cache" : options.cache;
    const cache = cacheFolder
      ? new Cache({ folder: site.src(cacheFolder) })
      : undefined;

    if (cacheFolder) {
      site.ignore(cacheFolder);
      site.options.watcher.ignore.push(cacheFolder);
    }

    site.addEventListener("afterRender", async (event) => {
      const content = await site.getContent(options.input, binLoader);

      if (!(content instanceof Uint8Array)) {
        throw new Error(`Favicon: ${options.input} not found`);
      }

      event.pages?.push(
        Page.create(
          "/favicon.ico",
          await buildIco(content, MagickFormat.Ico, 16, cache),
        ),
      );
      event.pages?.push(
        Page.create(
          "/favicon-32.png",
          await buildIco(content, MagickFormat.Png, 32, cache),
        ),
      );
      event.pages?.push(
        Page.create(
          "/favicon-16.png",
          await buildIco(content, MagickFormat.Png, 16, cache),
        ),
      );
      event.pages?.push(
        Page.create(
          "/apple-touch-icon.png",
          await buildIco(content, MagickFormat.Png, 180, cache),
        ),
      );
    });

    site.process([".html"], (page) => {
      const document = page.document!;

      addIcon(document, "icon", "32x32", site.url("/favicon-32.png"));
      addIcon(document, "icon", "16x16", site.url("/favicon-16.png"));
      addIcon(
        document,
        "apple-touch-icon",
        "180x180",
        site.url("/apple-touch-icon.png"),
      );
      addIcon(document, "shortcut icon", "16x16", site.url("/favicon.ico"));
    });
  };
}

function addIcon(document: Document, rel: string, sizes: string, href: string) {
  const link = document.createElement("link");
  link.setAttribute("rel", rel);
  link.setAttribute("sizes", sizes);
  link.setAttribute("href", href);
  document.head.appendChild(link);
  document.head.appendChild(document.createTextNode("\n"));
}

async function buildIco(
  content: Uint8Array,
  format: MagickFormat,
  size: number,
  cache?: Cache,
): Promise<Uint8Array> {
  if (cache) {
    const result = await cache.get(content, { format, size });

    if (result) {
      return result;
    }
  }

  return new Promise((resolve) => {
    ImageMagick.read(content, (image: IMagickImage) => {
      const geometry = new MagickGeometry(size, size);
      image.resize(geometry);

      image.write(format, (output: Uint8Array) => {
        if (cache) {
          cache.set(content, { format, size }, output);
        }
        resolve(new Uint8Array(output));
      });
    });
  });
}
