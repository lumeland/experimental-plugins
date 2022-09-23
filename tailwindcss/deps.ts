import dbin from "https://deno.land/x/dbin@v0.1.1/mod.ts";

export async function getTwBinFullPath(
  version: string,
  dir: string
): Promise<string> {
  return await dbin({
    pattern: `https://github.com/tailwindlabs/tailwindcss/releases/download/v{version}/tailwindcss-{target}`,
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
