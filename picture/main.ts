import { posix } from "lume/deps/path.ts";
import { getPathAndExtension } from "lume/core/utils.ts";
import { typeByExtension } from "lume/deps/media_types.ts";

import type { Transformation } from "lume/plugins/imagick.ts";
import type { MagickFormat } from "lume/deps/imagick.ts";
import type { Element } from "lume/deps/dom.ts";
import type { Plugin, Site } from "lume/core.ts";

interface SourceFormat {
  size: string;
  format: string;
}
interface Source extends SourceFormat {
  paths: string[];
}

export default function (): Plugin {
  return (site: Site) => {
    const transforms = new Map<string, Source>();

    site.process([".html"], (page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      const basePath = posix.dirname(page.outputPath!);
      const nodeList = document.querySelectorAll("[imagick]");

      for (const node of nodeList) {
        const element = node as Element;

        switch (element.tagName) {
          case "IMG":
            handleImg(element, basePath);
            break;
          case "PICTURE":
            handlePicture(element, basePath);
            break;
        }

        element.removeAttribute("imagick");
      }
    });

    site.process("*", (page) => {
      const path = page.outputPath!;

      for (const { paths, size, format } of transforms.values()) {
        if (paths.includes(path)) {
          const imagick: Transformation[] = page.data.imagick
            ? Array.isArray(page.data.imagick)
              ? page.data.imagick
              : [page.data.imagick]
            : (page.data.imagick = []);

          imagick.push({
            resize: parseInt(size),
            suffix: `-${size}`,
            format: format as MagickFormat,
          });
        }
      }
    });

    function handlePicture(picture: Element, basePath: string) {
      const img = picture.querySelector("img");
      const imagick = picture.getAttribute("imagick");

      if (!img) {
        throw new Error("picture element must have an img child");
      }

      if (!imagick) {
        throw new Error("picture element must have a imagick attribute");
      }

      const src = img.getAttribute("src");

      if (!src) {
        throw new Error("img element must have a src attribute");
      }

      const sourceFormats = saveTransform(basePath, src, imagick);

      for (const { size, format } of sourceFormats) {
        const source = img.ownerDocument!.createElement("source");
        source.setAttribute("srcset", getName(src, format, `-${size}`));
        source.setAttribute("type", typeByExtension(format));
        picture.insertBefore(source, img);
      }
    }

    function handleImg(img: Element, basePath: string) {
      const src = img.getAttribute("src");
      const imagick = img.getAttribute("imagick");

      if (!src) {
        throw new Error("img element must have a src attribute");
      }

      if (!imagick) {
        throw new Error("img element must have a imagick attribute");
      }

      const sourceFormats = saveTransform(basePath, src, imagick);

      const picture = img.ownerDocument!.createElement("picture");
      img.replaceWith(picture);

      for (const { size, format } of sourceFormats) {
        const source = img.ownerDocument!.createElement("source");
        source.setAttribute("srcset", getName(src, format, `-${size}`));
        source.setAttribute("type", typeByExtension(format));
        picture.append(source);
      }

      picture.append(img);
    }

    function saveTransform(
      basePath: string,
      src: string,
      imagick: string,
    ): SourceFormat[] {
      const path = src.startsWith("/") ? src : posix.join(basePath, src);
      const sizes: string[] = [];
      const formats: string[] = [];

      imagick.split(/\W+/).forEach((piece) => {
        if (piece.match(/^\d+w$/)) {
          sizes.push(piece);
        } else {
          formats.push(piece);
        }
      });

      const sourceFormats: SourceFormat[] = [];

      for (const size of sizes) {
        for (const format of formats) {
          const key = `${size}:${format}`;
          const transform = transforms.get(key);
          const sourceFormat = { size, format };

          sourceFormats.push(sourceFormat);

          if (transform && !transform.paths.includes(path)) {
            transform.paths.push(path);
            continue;
          }

          transforms.set(key, { paths: [path], ...sourceFormat });
        }
      }

      return sourceFormats;
    }
  };
}

function getName(url: string, format: string, suffix: string): string {
  let [path, ext] = getPathAndExtension(url);

  if (format) {
    ext = `.${format}`;
  }

  if (suffix) {
    path += suffix;
  }

  return path + ext;
}
