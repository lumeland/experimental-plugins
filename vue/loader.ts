import * as vue from "npm:@vue/compiler-sfc@3.5.39";
import { read } from "lume/core/utils/read.ts";
import type { Data, RawData } from "lume/core/file.ts";

export default async function load(path: string): Promise<RawData> {
  const code = await read(path, false);
  const parsed = vue.parse(code, {
    filename: path,
    templateParseOptions: {
      parseMode: "sfc",
    }
  });
  const { template, script, styles, filename, slotted, cssVars } = parsed.descriptor;

  const result = vue.compileTemplate({
    source: template?.content || "",
    ast: template?.ast,
    filename,
    slotted,
    isProd: true,
    id: path,
    ssr: true,
    ssrCssVars: cssVars
  });

  const blob = new Blob([result.code], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const { ssrRender } = await import(url);

  return {
    js: script?.content,
    css: styles.map((s) => s.content).join("\n"),
    content(data: Data) {
      const result: string[] = [];
      ssrRender(data, result.push.bind(result));
      return result.join("");
    },
  };
}
