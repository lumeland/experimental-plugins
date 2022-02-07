import esbuild, { Options } from "lume/plugins/esbuild.ts";

export default function (userOptions?: Partial<Options>) {
  console.error("esbuild plugin was moved to lume/plugins/esbuild.ts");
  return esbuild(userOptions);
}
