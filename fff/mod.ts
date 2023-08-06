import type { Site } from "lume/core.ts";

import { merge } from "lume/core/utils.ts";

import {
  type FFFTransformPreset,
  transform,
} from "https://deno.land/x/fff@v1.0.1/src/utils/transform.ts";

import {
  strict,
  type StrictPresetOptions,
} from "https://deno.land/x/fff@v1.0.1/src/utils/presets/strict.ts";

export interface Options {
  presets: FFFTransformPreset[];
  strict: false | StrictPresetOptions;
}

// Default options
export const defaults: Options = {
  presets: [],
  strict: false,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess([".html"], (page) => {
      page.data = transform(page.data, [
        ...options.presets,
        ...(options.strict === false ? [] : [strict(options.strict)]),
      ]);
    });
  };
}
