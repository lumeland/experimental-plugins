import * as vue from "npm:@vue/compiler-sfc@3.5.6";
import { read } from "lume/core/utils/read.ts";
import type { Data, RawData } from "lume/core/file.ts";

export default async function load(path: string): Promise<RawData> {
  const code = await read(path, false);
  const parsed = vue.parse(code, { filename: path });
  const { template, script, styles } = parsed.descriptor;

  const result = vue.compileTemplate({
    source: template?.content || "",
    ssr: true,
    filename: path,
    id: path,
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
