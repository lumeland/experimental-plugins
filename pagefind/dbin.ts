import {
  dirname,
  join,
  resolve,
} from "https://deno.land/std@0.139.0/path/mod.ts";
import { Untar } from "https://deno.land/std@0.139.0/archive/tar.ts";
import { copy } from "https://deno.land/std@0.139.0/streams/conversion.ts";

export interface Options {
  pattern: string;
  version: string;
  targets: Target[];
  dest: string;
  overwrite?: boolean;
  chmod?: number;
}

export interface Target {
  name: string;
  os: "darwin" | "linux" | "windows";
  arch: "x86_64" | "aarch64";
}

export default async function downloadBin(options: Options): Promise<string> {
  const dest = Deno.build.os === "windows"
    ? resolve(options.dest) + ".exe"
    : resolve(options.dest);
  console.log({ dest });
  // Check if the file already exists and return the path
  try {
    await Deno.stat(dest);
    if (!options.overwrite) {
      return dest;
    }
  } catch {
    // File does not exist
  }

  // Detect the target
  const target = options.targets.find((target) => {
    return target.os === Deno.build.os && target.arch === Deno.build.arch;
  });
  console.log({ target });

  if (!target) {
    throw new Error("No target found");
  }

  // Download the tarball
  const url = options.pattern
    .replaceAll("{target}", target.name)
    .replaceAll("{version}", options.version);

  console.log(`Downloading ${url}...`);
  const tmp = await Deno.makeTempDir();
  console.log({ tmp, url });
  await download(new URL(url), join(tmp, "tmp.tar.gz"));

  // Extract the binary
  const tgz = await Deno.open(join(tmp, "tmp.tar.gz"));
  const tar = await Deno.create(join(tmp, "tmp.tar"));

  await tgz.readable
    .pipeThrough(new DecompressionStream("gzip"))
    .pipeTo(tar.writable);

  const reader = await Deno.open(join(tmp, "tmp.tar"), { read: true });
  const untar = new Untar(reader);

  try {
    await Deno.mkdir(dirname(dest), { recursive: true });
  } catch (err) {
    console.log({ err });
    // Directory exists
  }

  // Copy the first binary file found in the tarball
  for await (const entry of untar) {
    if (entry.type === "directory") {
      continue;
    }
    console.log({ entry });
    const file = await Deno.create(dest);
    await copy(entry, file);
    file.close();
    break;
  }
  reader.close();
  await Deno.remove(tmp, { recursive: true });

  // Change file permissions
  try {
    if (options.chmod) {
      await Deno.chmod(dest, options.chmod);
    } else {
      await Deno.chmod(dest, 0o764);
    }
  } catch (err) {
    console.log({ err });
    // Not supported on Windows
  }
  return dest;
}

async function download(url: URL, dest: string): Promise<void> {
  const blob = await (await fetch(url)).blob();
  const sha256sum = await (await fetch(url.href + ".sha256")).text();
  const content = new Uint8Array(await blob.arrayBuffer());

  try {
    await Deno.mkdir(dirname(dest), { recursive: true });
  } catch {
    // Directory exists
  }

  await checkSha256sum(content, sha256sum);
  await Deno.writeFile(dest, content);
}

async function checkSha256sum(
  content: Uint8Array,
  sha256sum: string,
): Promise<void> {
  const hash = await crypto.subtle.digest("SHA-256", content);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  sha256sum = sha256sum.split(/\s+/).shift()!;

  if (hashHex !== sha256sum) {
    throw new Error("SHA-256 checksum mismatch");
  }
}
