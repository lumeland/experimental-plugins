import type { DeepPartial, Site } from "lume/core.ts";
import { merge, read } from "lume/core/utils.ts";

import { UnoGenerator, type UserConfig } from "npm:@unocss/core@0.53.5";
import { presetUno } from "npm:@unocss/preset-uno@0.53.5";

export interface Options {
  /** UnoCSS Config */
  config?: UserConfig;
  /**
   * Supported CSS reset options.
   * @see {@link https://github.com/unocss/unocss/tree/v0.53.5/packages/reset}
   */
  reset: false | "tailwind" | "tailwind-compat" | "eric-meyer";
}

export const defaults: Options = {
  config: {
    presets: [presetUno()],
  },
  reset: "tailwind",
};

export default (userOptions: DeepPartial<Options> = {}) => {
  const options = merge(defaults, userOptions) as Options;

  const uno = new UnoGenerator(options.config);

  return (site: Site) => {
    site.process([".html"], async (page) => {
      const { css } = await uno.generate(
        page.document?.documentElement?.innerHTML ?? "",
      );

      if (options.reset !== false) {
        const style = page.document!.createElement("style");
        /**
         * TODO: Replace with CSS Modules Import
         * @remarks Deno does not currently support CSS Modules.
         * @see {@link https://github.com/denoland/deno/issues/11961}
         */
        style.innerText = await read(
          `https://unpkg.com/@unocss/reset@0.53.5/${options.reset}.css`,
          false,
        );
        page.document?.head?.appendChild(style);
      }

      if (css) {
        const style = page.document!.createElement("style");
        style.innerText = css;
        page.document?.head?.appendChild(style);
      }
    });
  };
};
