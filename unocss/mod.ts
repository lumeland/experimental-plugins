import type { DeepPartial, Site } from "lume/core.ts";
import { merge } from "lume/core/utils.ts";

import { UnoGenerator, type UserConfig } from "npm:@unocss/core@0.53.5";
import presetUno from "npm:@unocss/preset-uno@0.53.5";

export interface Options {
  config?: UserConfig;
  reset?: false | "tailwind";
}

// import reset from "npm:@unocss/reset@0.53.5/tailwind.css" assert { type: "css" };
/**
 * Deno does not currently support CSS Modules.
 * @see {@link https://github.com/denoland/deno/issues/11961}
 * @remarks Inlined from {@link https://esm.sh/@unocss/reset@0.53.5/tailwind.css}
 */
const reset =
  `*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-0.25em}sup{top:-0.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type='button'],[type='reset'],[type='submit'],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type='search']{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role="button"],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}`;

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
        page.document?.documentElement?.innerHTML,
      );

      if (css) {
        const style = page.document!.createElement("style");
        style.innerText = options.reset === "tailwind" ? reset + css : css;
        page.document?.head?.appendChild(style);
      }
    });
  };
};
