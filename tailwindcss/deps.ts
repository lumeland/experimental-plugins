import type { Page } from "lume/core.ts";

import dbin from "dbin/mod.ts";

export async function getTwBinFullPath(
  version: string,
  dir: string,
): Promise<string> {
  return await dbin({
    pattern:
      `https://github.com/tailwindlabs/tailwindcss/releases/download/v{version}/tailwindcss-{target}`,
    version,
    targets: [
      { name: "linux-x64", os: "linux", arch: "x86_64" },
      { name: "linux-arm64", os: "linux", arch: "aarch64" },
      { name: "macos-x64", os: "darwin", arch: "x86_64" },
      { name: "macos-arm64", os: "darwin", arch: "aarch64" },
      { name: "windows-x64.exe", os: "windows", arch: "x86_64" },
    ],
    dest: `${dir}/tailwindcss`,
  });
}

export function addCssLink2Head(page: Page) {
  const { document } = page;
  if (!document) return;
  const cssLinkEl = document.createElement(
    `<link rel="stylesheet" href="css/main.css" />`,
  );

  if (!Array.from(document.head.children).includes(cssLinkEl)) {
    document.head.appendChild(cssLinkEl);
  }
}
