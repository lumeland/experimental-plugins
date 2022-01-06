import { merge } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";
import { extname } from "lume/deps/path.ts";
import type { Site } from "lume/core.ts";
import {
  ImageMagick,
  IMagickImage,
  initializeImageMagick,
  MagickFormat,
} from "./deps.ts";

await initializeImageMagick(); // make sure to initialize first!

export interface Options {
  /** The list files and transformations */
  transform: Record<string, Transformation | Transformation[]>;
}

// Default options
export const defaults: Options = {
  transform: {},
};

export type Transformation = (
  image: IMagickImage,
  url: string,
) => void | string;

/** A plugin to transform images in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process("*", transform);

    function transform(page: Page) {
      const url = page.data.url as string;
      const result = options.transform[url];

      if (!result) {
        return;
      }

      const transformations: Transformation[] = Array.isArray(result)
        ? result
        : [result];
      const content = page.content as Uint8Array;

      transformations.forEach((transformation) => {
        ImageMagick.read(content, (image: IMagickImage) => {
          const newUrl = transformation(image, url);

          image.write((content: Uint8Array) => {
            if (!newUrl || url === newUrl) {
              page.content = content;
              return;
            }

            const newPage = page.duplicate({ url: newUrl });
            const ext = extname(newUrl);
            newPage.content = new Uint8Array(content);
            newPage.dest.ext = ext;
            newPage.dest.path = newUrl.slice(0, -ext.length);
            site.pages.push(newPage);
          }, MagickFormat.Jpeg);
        });
      });
    }
  };
}
