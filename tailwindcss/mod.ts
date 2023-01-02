import tailwind, { Config } from "npm:@lumeland/tailwindcss@3.2.5";
import { merge } from "lume/core/utils.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  extensions: string[];
  options: Omit<Config, "content">;
}

export const defaults: Options = {
  extensions: [".html"],
  options: {},
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // deno-lint-ignore no-explicit-any
    let tailwindPlugins: any[];

    if (site.hooks.postcss) {
      throw new Error(
        "PostCSS plugin is required to be installed AFTER TailwindCSS plugin",
      );
    }

    site.processAll(options.extensions, (pages) => {
      // Get the content of all pages
      const content = pages.map((page) => ({ raw: page.content as string }));

      // Create Tailwind plugin
      const plugin = tailwind({
        content,
        ...options.options,
      });

      // Ensure PostCSS plugin is installed
      if (!site.hooks.postcss) {
        throw new Error(
          "PostCSS plugin is required to be installed AFTER TailwindCSS plugin",
        );
      }

      // Replace the old Tailwind plugin configuration from PostCSS plugins
      // deno-lint-ignore no-explicit-any
      site.hooks.postcss((runner: any) => {
        tailwindPlugins?.forEach((plugin) => {
          runner.plugins.splice(runner.plugins.indexOf(plugin), 1);
        });
        tailwindPlugins = runner.normalize([plugin]);
        runner.plugins = runner.plugins.concat(tailwindPlugins);
      });
    });
  };
}
