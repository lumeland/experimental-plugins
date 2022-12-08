import { merge, sha1 } from "lume/core/utils.ts";

import type { Data, Engine, Helper, HelperOptions, Site } from "lume/core.ts";

import { WebC } from "npm:@11ty/webc@0.8.0";

export class WebCEngine implements Engine {
  components: string;
  extraCode: Map<string, Map<string, string>>;
  helpers = new Map<string, Helper>();

  constructor(components: string, extraCode: Map<string, Map<string, string>>) {
    this.components = components;
    this.extraCode = extraCode;
  }

  async render(
    content: unknown,
    data?: Data | undefined,
    filename?: string | undefined,
  ) {
    const webc = new WebC();
    webc.setBundlerMode(true);
    webc.defineComponents(this.components);

    for (const [key, val] of this.helpers) {
      webc.setHelper(key, val);
    }

    webc.setContent(content, filename);

    const { html, css, js } = await webc.compile({ data });

    if (css) {
      const code = this.extraCode.get("css") ?? new Map();
      await Promise.all(
        css.map(async (str: string) => code.set(await sha1(str), str)),
      );
      this.extraCode.set("css", code);
    }

    if (js) {
      const code = this.extraCode.get("js") ?? new Map();
      await Promise.all(
        js.map(async (str: string) => code.set(await sha1(str), str)),
      );
      this.extraCode.set("js", code);
    }

    return html;
  }

  renderSync() {
    throw "Cannot render webc synchronously";
  }

  addHelper(name: string, fn: Helper, _options: HelperOptions): void {
    this.helpers.set(name, fn);
  }

  deleteCache(file: string): void {
    if (file.endsWith(".webc")) {
      this.extraCode.clear();
    }
  }
}

export interface Options {
  includes: string;
}

export const defaults: Options = {
  includes: "_includes/webc/**.webc",
};

export default (userOptions: Partial<Options>) => {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const components = options.includes;
    const extraCode = site.source.extraCode;
    const webcEngine = new WebCEngine(components, extraCode);

    site.engine([".webc"], webcEngine);
  };
};
