import lume from "lume/mod.ts";
import imagick from "../imagick.ts";
import binaryLoader from "lume/core/loaders/binary.ts";

const site = lume();

site
  .loadAssets([".jpg"], binaryLoader)
  .use(imagick({
    transform: {
      "/unsplash.jpg": [
        (image) => {
          image.resize(200, 200);
          return "/unsplash-small.jpg";
        },
        (image) => {
          image.resize(200, 200);
          image.blur(20, 6);
          return "/unsplash-small-blur.jpg";
        },
      ],
    },
  }));

export default site;
