import { Page } from "lume/core/filesystem.ts";
import { merge } from "lume/core/utils.ts";
import { posix } from "lume/deps/path.ts";
import { stringify } from "lume/deps/yaml.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  local: boolean;
  path: string;
  options: Record<string, unknown>;
  netlifyIdentity: boolean;
}

const defaults: Options = {
  local: false,
  path: "/admin/",
  options: {},
  netlifyIdentity: false,
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (options.local) {
      site.addEventListener("afterBuild", "npx netlify-cms-proxy-server");
    }

    site.addEventListener("beforeSave", () => {
      // config.yml
      const config = new Page();
      config.dest.path = posix.join(options.path, "config");
      config.dest.ext = ".yml";
      config.content = stringify({
        local_backend: options.local,
        ...options.options,
      });

      site.pages.push(config);

      // index.html
      const configUrl = site.url(posix.join(options.path, "config.yml"));
      const index = new Page();
      index.dest.path = posix.join(options.path, "index");
      index.dest.ext = ".html";
      index.content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin</title>
      </head>
      <body>
        <link href="${configUrl}" type="text/yaml" rel="cms-config-url">
        <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
        ${
        options.netlifyIdentity
          ? `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>`
          : ""
      }
      </body>
      </html>
      `;

      site.pages.push(index);
    });
  };
}
