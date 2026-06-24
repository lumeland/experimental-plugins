import lume from "lume/mod.ts";
import typst from "../mod.ts";

const site = lume();

site.remoteFile(
  "/fonts/Pacifico-Regular.ttf",
  "https://cdn.jsdelivr.net/gh/google/fonts@refs/heads/main/ofl/pacifico/Pacifico-Regular.ttf",
);

site.use(typst({
  fonts: [
    "/fonts",
  ],
}));

export default site;
