import { merge } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";
import { extname } from "lume/deps/path.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { ImageMagick, initializeImageMagick } from "./deps.ts";

import type { Site } from "lume/core.ts";
import type { IMagickImage } from "./deps.ts";

await initializeImageMagick(); // make sure to initialize first!

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".jpg", ".jpeg", ".png"],
};

export type Transformation = (image: IMagickImage) => void;
export type Transformations = (
  page: Page,
) => Record<string, Transformation> | undefined;

/** A plugin to transform images in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(options.extensions, transform);

    function transform(page: Page) {
      const imagick = page.data.imagick as Transformations | undefined;

      if (!imagick) {
        return;
      }

      const transformations = imagick(page);

      if (!transformations) {
        return;
      }

      const content = page.content as Uint8Array;

      for (const [newUrl, transformation] of Object.entries(transformations)) {
        ImageMagick.read(content, (image: IMagickImage) => {
          transformation(image);

          image.write((content: Uint8Array) => {
            if (newUrl === page.dest.path + page.dest.ext) {
              page.content = content;
              return;
            }

            const newPage = page.duplicate({ url: newUrl });
            const ext = extname(newUrl);
            newPage.content = new Uint8Array(content);
            newPage.dest.ext = ext;
            newPage.dest.path = newUrl.slice(0, -ext.length);
            site.pages.push(newPage);
          });
        });
      }
    }
  };
}
