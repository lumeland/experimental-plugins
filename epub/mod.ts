import {
  BlobWriter,
  Uint8ArrayReader,
  ZipWriter,
} from "jsr:@zip-js/zip-js@2.8.8";
import { Page, filesToPages } from "lume/core/file.ts";
import { filter404page } from "lume/core/utils/page_url.ts";
import { merge } from "lume/core/utils/object.ts";
import { createContainer, createOPF, type Metadata } from "./epub.ts";

export interface Options {
  metadata?: Metadata;
  output?: string;
  exclude?: (string | ((path: string) => boolean))[];
  sort?: (a: Page, b: Page) => number;
}

export const defaults: Options = {
  metadata: {
    title: "Untitled",
    identifier: "urn:uuid:00000000-0000-0000-0000-000000000000",
    description: "No description",
    publisher: "Unknown",
    rights: "All rights reserved",
    date: new Date(),
  },
  output: "/book.epub",
  exclude: [],
  sort: (a, b) => a.outputPath.localeCompare(b.outputPath),
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    const filter404 = filter404page(site.options.server.page404);
    const filterFn = getExcludeFunction(options.exclude);

    site.process(async () => {
      // Convert all static files to pages to include them in the EPUB
      await filesToPages(
        site.files,
        site.pages,
        (file) => filterFn(file.outputPath),
      );

      const files = site.pages
        .filter((page) => filter404(page.data))
        .filter((page) => filterFn(page.outputPath))
        .sort(options.sort)
        .map((page) => ({ href: page.outputPath.slice(1) }));

      // Create the EPUB structure
      const content = await site.getOrCreatePage("/content.opf");
      content.text = createOPF({
        metadata: options.metadata,
        files,
      });
      const container = await site.getOrCreatePage("/META-INF/container.xml");
      container.text = createContainer(content.outputPath.slice(1));

      const mimeType = await site.getOrCreatePage("/mimetype");
      mimeType.text = "application/epub+zip";

      // Create the EPUB file
      const zipWriter = new ZipWriter(new BlobWriter("application/epub+zip"));

      for (const page of site.pages) {
        const path = page.outputPath.slice(1);
        await zipWriter.add(path, new Uint8ArrayReader(page.bytes));
      }
      const zip = await zipWriter.close();
      const epub = await site.getOrCreatePage(options.output);
      epub.bytes = new Uint8Array(await zip.arrayBuffer());
    });
  };
}

function getExcludeFunction(
  exclude: Options["exclude"],
): (path: string) => boolean {
  if (!exclude || exclude.length === 0) {
    return () => true;
  }

  return (path: string) =>
    exclude.some((filter) =>
      typeof filter === "string" ? path !== filter : !filter(path)
    );
}
