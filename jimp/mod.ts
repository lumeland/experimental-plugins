import { merge } from "lume/core/utils.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import { Exception } from "lume/core/errors.ts";
import { Buffer, Jimp } from "./deps.ts";

import type { Page, Site } from "lume/core.ts";

const formats: Record<string, string> = {
  png: Jimp.MIME_PNG,
  tiff: Jimp.MIME_TIFF,
  jpg: Jimp.MIME_JPEG,
  jpeg: Jimp.MIME_JPEG,
  bmp: Jimp.MIME_BMP,
  gif: Jimp.MIME_GIF,
};

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The key name for the transformations definitions */
  name: string;

  /** Custom transform functions */
  functions: {
    // deno-lint-ignore no-explicit-any
    [key: string]: (image: Jimp, ...args: any[]) => void;
  };
}

// Default options
export const defaults: Options = {
  extensions: [".jpg", ".jpeg", ".png"],
  name: "jimp",
  functions: {
    resize(image: Jimp, width: number, height = Jimp.AUTO): void {
      image.resize(width, height);
    },
    blur(image: Jimp, radius: number): void {
      image.blur(radius);
    },
  },
};

export interface Transformation {
  suffix?: string;
  resize?: number;
  blur?: number;
  format?: keyof typeof formats;
}

export type Transformations = Transformation[];

/** A plugin to transform images in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(options.extensions, jimp);

    async function jimp(page: Page) {
      const jimp = page.data[options.name] as
        | Transformation
        | Transformations
        | undefined;

      if (!jimp || page._data.jimp === JSON.stringify(jimp)) {
        // No transformation or already processed
        return;
      }

      page._data.imagick = JSON.stringify(jimp);
      site.logger.log("🎨", `${page.src.path}${page.src.ext}`);

      const content = page.content as Uint8Array;

      const transformations = Array.isArray(jimp) ? jimp : [jimp];
      const last = transformations[transformations.length - 1];

      for (const transformation of transformations) {
        const output = transformation === last
          ? page
          : page.duplicate({ [options.name]: undefined });

        await transform(content, output, transformation, options);

        if (output !== page) {
          site.pages.push(output);
        }
      }
    }
  };
}

async function transform(
  content: Uint8Array,
  page: Page,
  transformation: Transformation,
  options: Options,
): Promise<void> {
  const image = await Jimp.read(Buffer.from(content));
  let format: keyof typeof formats = image.getExtension();

  for (const [name, args] of Object.entries(transformation)) {
    if (args === undefined || args === null || args === false) {
      continue;
    }

    switch (name) {
      case "suffix":
        page.path += args;
        break;

      case "format":
        if (!(args in formats)) {
          throw new Exception(`Unknown format: ${args}`);
        }
        format = args;
        break;

      default:
        if (!options.functions[name]) {
          throw new Exception(`Unknown transformation: ${name}`);
        }

        if (Array.isArray(args)) {
          options.functions[name](image, ...args);
        } else {
          options.functions[name](image, args);
        }
    }
  }

  const buffer = await image.getBufferAsync(formats[format]);
  page.content = new Uint8Array(buffer);
  page.ext = "." + format;
}
