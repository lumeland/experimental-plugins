import { getPathAndExtension } from "lume/core/utils/path.ts";
import { log } from "lume/core/utils/log.ts";
import { merge } from "lume/core/utils/object.ts";
import { concurrent } from "lume/core/utils/concurrent.ts";
import binaryLoader from "lume/core/loaders/binary.ts";
import sharp from "npm:sharp@0.33.0";
import Cache from "lume/core/cache.ts";

import type Site from "lume/core/site.ts";
import type { Page } from "lume/core/file.ts";

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The key name for the transformations definitions */
  name: string;

  /** The cache folder */
  cache: string | boolean;

  /** Custom transform functions */
  functions: Record<string, TransformationFunction>;
}

export type TransformationFunction = (
  image: sharp.Sharp,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) => void;

// Default options
export const defaults: Options = {
  extensions: [".jpg", ".jpeg", ".png"],
  name: "sharp",
  cache: true,
  functions: {
    resize(image: sharp.Sharp, width: number, height = width): void {
      image.resize(width, height);
    },
    blur(image: sharp.Sharp, sigma?: number | boolean): void {
      image.blur(sigma, sigma);
    },
    sharpen(
      image: sharp.Sharp,
      sigma?: number,
      flat?: number,
      jagged?: number,
    ): void {
      image.sharpen(sigma, flat, jagged);
    },
    rotate(image: sharp.Sharp, degrees: number): void {
      image.rotate(degrees);
    },
  },
};

export type Format =
  | "jpeg"
  | "jp2"
  | "jxl"
  | "png"
  | "webp"
  | "gif"
  | "avif"
  | "heif"
  | "tiff";

export interface Transformation {
  suffix?: string;
  format?: Format | Format[];
  matches?: RegExp | string;
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}
interface SingleTransformation extends Transformation {
  format?: Format;
}

/** A plugin to transform images in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(options.extensions, process);

    // Configure the cache folder
    const cacheFolder = options.cache === true ? "_cache" : options.cache;
    const cache = cacheFolder
      ? new Cache({ folder: site.src(cacheFolder) })
      : undefined;

    if (cacheFolder) {
      site.ignore(cacheFolder);
      site.options.watcher.ignore.push(cacheFolder);
    }

    async function process(pages: Page[], allPages: Page[]) {
      await concurrent(
        pages,
        async (page) => processPage(page, allPages),
      );
    }
    async function processPage(page: Page, allPages: Page[]) {
      const transData = page.data[options.name] as
        | Transformation
        | Transformation[]
        | undefined;

      if (!transData) {
        return;
      }

      const content = page.content as Uint8Array;
      const transformations = removeDuplicatedTransformations(
        getTransformations(transData),
      );
      let transformed = false;
      let index = 0;
      for (const transformation of transformations) {
        if (transformation.matches) {
          const regex = new RegExp(transformation.matches);
          if (!regex.test(page.data.url as string)) {
            continue;
          }
        }

        const output = page.duplicate(index++, {
          ...page.data,
          [options.name]: undefined,
        });

        rename(output, transformation);

        if (cache) {
          const result = await cache.get(content, transformation);

          if (result) {
            output.content = result;
          } else {
            await transform(content, output, transformation, options);
            transformed = true;
            await cache.set(content, transformation, output.content!);
          }
        } else {
          await transform(content, output, transformation, options);
          transformed = true;
        }

        if (output !== page) {
          allPages.push(output);
        }
      }

      if (transformed) {
        log.info(`[imagick plugin] Processed ${page.sourcePath}`);
      }

      // Remove the original page
      allPages.splice(allPages.indexOf(page), 1);
    }
  };
}

async function transform(
  content: Uint8Array,
  page: Page,
  transformation: Transformation,
  options: Options,
): Promise<void> {
  const image = sharp(content);

  for (const [name, args] of Object.entries(transformation)) {
    switch (name) {
      case "suffix":
      case "matches":
        break;

      case "format":
        image[args as Format]();
        break;

      default:
        if (!options.functions[name]) {
          throw new Error(`Unknown transformation: ${name}`);
        }

        if (Array.isArray(args)) {
          options.functions[name](image, ...args);
        } else {
          options.functions[name](image, args);
        }
    }
  }

  page.content = new Uint8Array(await image.toBuffer());
}

function rename(page: Page, transformation: Transformation): void {
  const { format, suffix } = transformation;
  const url = page.data.url;

  if (!url) {
    return;
  }

  let [path, ext] = getPathAndExtension(url);

  if (format) {
    ext = `.${format}`;
  }

  if (suffix) {
    path += suffix;
  }

  page.data.url = path + ext;
}

function getTransformations(
  input: Transformation | Transformation[],
): SingleTransformation[] {
  if (Array.isArray(input)) {
    const singles: SingleTransformation[] = [];

    for (const transformation of input) {
      if (Array.isArray(transformation.format)) {
        transformation.format.forEach((format) => {
          singles.push({ ...transformation, format });
        });
      } else {
        singles.push(transformation as SingleTransformation);
      }
    }
    return singles;
  }

  if (Array.isArray(input.format)) {
    return input.format.map((format) => ({ ...input, format }));
  }

  return [input as SingleTransformation];
}

function removeDuplicatedTransformations(
  transformations: SingleTransformation[],
): SingleTransformation[] {
  const result = new Map<string, SingleTransformation>();

  for (const transformation of transformations) {
    const { format, suffix, matches } = transformation;
    const key = `${format}:${suffix ?? ""}${matches ?? ""}`;
    result.set(key, transformation);
  }

  return [...result.values()];
}
