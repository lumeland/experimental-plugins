import { merge } from "lume/core/utils.ts";
import { Page } from "lume/core/filesystem.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { ImageMagick, initializeImageMagick, MagickFormat } from "./deps.ts";

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

export interface Transformation {
  suffix?: string;
  resize?: [number, number];
  crop?: [number, number];
  blur?: [number, number?];
  sharpen?: [number, number?];
  rotate?: number;
  autoOrient?: boolean;
  format?: MagickFormat;
}
export type Transformations = Transformation[];

/** A plugin to transform images in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(options.extensions, imagick);

    function imagick(page: Page) {
      const imagick = page.data.imagick as
        | Transformation
        | Transformations
        | undefined;

      if (!imagick) {
        return;
      }

      const content = page.content as Uint8Array;
      const transformations = Array.isArray(imagick) ? imagick : [imagick];
      const last = transformations[transformations.length - 1];

      for (const transformation of transformations) {
        const output = transformation === last
          ? page
          : page.duplicate({ imagick: undefined });

        transform(content, output, transformation);

        if (output !== page) {
          site.pages.push(output);
        }
      }
    }
  };
}

function transform(
  content: Uint8Array,
  page: Page,
  transformation: Transformation,
): void {
  let format: MagickFormat | undefined = undefined;

  ImageMagick.read(content, (image: IMagickImage) => {
    for (const [name, args] of Object.entries(transformation)) {
      if (args === undefined || args === null || args === false) {
        continue;
      }

      switch (name) {
        case "suffix":
          page.path += args;
          break;

        case "resize":
        case "crop":
        case "blur":
        case "sharpen":
          image[name](...args as [number, number]);
          break;

        case "rotate":
          image.rotate(args);
          break;

        case "autoOrient":
          image.autoOrient();
          break;

        case "format":
          format = args;
          page.ext = "." + args.toLowerCase();
          break;
      }
    }

    image.write(
      (content: Uint8Array) => page.content = new Uint8Array(content),
      format,
    );
  });
}
