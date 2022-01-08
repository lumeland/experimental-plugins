import type { IMagickImage } from "../../deps.ts";
import type { Page } from "lume/core.ts";

export function imagick(page: Page) {
  const { path, ext } = page.dest;

  return {
    [path + ext](image: IMagickImage) {
      image.resize(128, 128);
    },
    [path + "-small" + ext](image: IMagickImage) {
      image.resize(64, 64);
    },
    [path + "-big" + ext](image: IMagickImage) {
      image.resize(256, 256);
    },
  };
}
