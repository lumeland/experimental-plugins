import dbin from "https://deno.land/x/dbin@v0.1.1/mod.ts";

export default async function downloadBinary(dest: string): Promise<string> {
  return await dbin({
    pattern:
      "https://github.com/CloudCannon/pagefind/releases/download/{version}/pagefind-{version}-{target}.tar.gz",
    version: "v0.8.1",
    targets: [
      { name: "x86_64-unknown-linux-musl", os: "linux", arch: "x86_64" },
      { name: "x86_64-apple-darwin", os: "darwin", arch: "x86_64" },
      { name: "x86_64-pc-windows-msvc", os: "windows", arch: "x86_64" },
    ],
    dest,
  });
}
