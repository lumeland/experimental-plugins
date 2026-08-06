import lume from "lume/mod.ts";
import typst from "../mod.ts";
import duplicatePages from "../../duplicate_pages/mod.ts";

const site = lume();

site.add(
  "https://cdn.jsdelivr.net/gh/google/fonts@refs/heads/main/ofl/pacifico/Pacifico-Regular.ttf",
  "/fonts/Pacifico-Regular.ttf",
);

site.use(duplicatePages<{ output: string[] }>({
  *fn(data) {
    if (data.output) {
      for (const format of data.output) {
        yield {
          ...data,
          url: data.url.replace(".pdf", `.${format}`),
        };
      }
    }
  },
}));

site.use(typst());

export default site;
