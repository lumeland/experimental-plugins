import type { Site } from "lume/core.ts";
import type { PartytownConfig } from "npm:@builder.io/partytown@0.8.0";
import { partytownSnippet } from "npm:@builder.io/partytown@0.8.0/integration";

export type LumePartytownOptions = {
  /** @defaultValue `https://cdn.jsdelivr.net/npm/@builder.io/partytown@0.8.0/lib/` */
  libFilesBase?: string;
  config?: PartytownConfig;
};

export default (options?: LumePartytownOptions) => (site: Site) => {
  const snippetText = partytownSnippet({
    ...options?.config,
    lib: new URL(
      `.${options?.config?.lib ?? "/~partytown/"}`,
      site.options.location,
    )
      .pathname,
  });

  const libFiles = [
    "partytown.js",
    "partytown-atomics.js",
    "partytown-media.js",
    "partytown-sw.js",
    ...(options?.config?.debug
      ? [
        "debug/partytown.js",
        "debug/partytown-atomics.js",
        "debug/partytown-media.js",
        "debug/partytown-sandbox-sw.js",
        "debug/partytown-sw.js",
        "debug/partytown-ww-atomics.js",
        "debug/partytown-ww-sw.js",
      ]
      : []),
  ];

  for (const libFile of libFiles) {
    const libFilePath = `${options?.config?.lib ?? "/~partytown/"}${libFile}`;

    site.remoteFile(
      libFilePath,
      new URL(
        libFile,
        options?.libFilesBase ??
          "https://cdn.jsdelivr.net/npm/@builder.io/partytown@0.8.0/lib/",
      ).toString(),
    );
    site.copy(libFilePath);
  }

  site.process([".html"], (page) => {
    const script = page.document!.createElement("script");
    script.textContent = snippetText;
    page.document!.head.appendChild(script);
  });
};
