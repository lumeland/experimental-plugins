import { read, readFile } from "lume/core/utils/read.ts";
import { posix } from "lume/deps/path.ts";

export interface Options {
  fonts: string;
  folder?: string;
  cssFile?: string;
}

export const defaults: Options = {
  fonts: "",
  folder: "/fonts",
  cssFile: "/fonts.css",
};

export function googleFonts(userOptions: Options): Lume.Plugin {
  const options = { ...defaults, ...userOptions } as Required<Options>;

  return (site: Lume.Site) => {
    site.addEventListener("beforeBuild", async () => {
      const css = await readFile(getCssUrl(options.fonts));
      const fontFaces = extractFontFaces(css);

      await Promise.all(fontFaces.map(async (fontFace) => {
        const content = await read(fontFace.src, true);
        site.page({
          content,
          url: posix.join("/", options.folder, fontFace.file),
        });
      }));

      const cssFile = posix.join("/", options.cssFile);
      const relativePath = posix.relative(
        posix.dirname(cssFile),
        posix.join(options.folder),
      );

      site.page({
        content: generateCss(fontFaces, relativePath),
        url: cssFile,
      });
    });
  };
}

export default googleFonts;

interface FontFace {
  family: string;
  style: string;
  weight: string;
  src: string;
  file: string;
  range: string;
  subset: string;
}

function extractFontFaces(css: string): FontFace[] {
  const fontFaces = css.match(/\/\*[^*]+\*\/[\s]+@font-face {[^}]+}/g) || [];

  return fontFaces.map((fontFace) => {
    const subset = fontFace.match(/\/\* ([^*]+) \*\//)?.[1];
    const family = fontFace.match(/font-family: '([^']+)'/)?.[1];
    const style = fontFace.match(/font-style: ([^;]+);/)?.[1];
    const weight = fontFace.match(/font-weight: ([^;]+);/)?.[1];
    const src = fontFace.match(/src: url\('?([^']+)'?\)/)?.[1];
    const range = fontFace.match(/unicode-range: ([^;]+);/)?.[1];

    if (!family || !style || !weight || !src || !range || !subset) {
      throw new Error("Invalid font-face");
    }

    const file = `${family}-${style}-${weight}-${subset}.woff2`.replaceAll(
      " ",
      "_",
    ).toLowerCase();

    return {
      subset,
      family,
      style,
      weight,
      src,
      range,
      file,
    };
  });
}

function generateCss(fontFaces: FontFace[], fontsFolder: string): string {
  return fontFaces.map((fontFace) => {
    return `@font-face {
  font-family: '${fontFace.family}';
  font-style: ${fontFace.style};
  font-weight: ${fontFace.weight};
  src: url('${posix.join(fontsFolder, fontFace.file)}') format('woff2');
  unicode-range: ${fontFace.range};
}
`;
  }).join("\n");
}

function getCssUrl(fonts: string): string {
  const url = new URL(fonts);

  // Share URL
  if (url.host === "fonts.googleapis.com" && url.pathname === "/css2") {
    url.searchParams.append("display", "swap");
    return url.href;
  }

  // Selection URL
  if (url.host === "fonts.google.com" && url.pathname === "/share") {
    const selection = url.searchParams.get("selection.family");
    if (!selection) {
      throw new Error("Invalid Google Fonts URL");
    }
    const apiUrl = new URL("https://fonts.googleapis.com/css2");
    selection.split("|").forEach((family) => {
      apiUrl.searchParams.append("family", family);
    });
    return apiUrl.href;
  }

  throw new Error(`Invalid Google Fonts URL: ${fonts}`);
}
