import { Page } from "lume/core/filesystem.ts";
import { merge } from "lume/core/utils.ts";
import { posix } from "lume/deps/path.ts";
import { stringify } from "lume/deps/yaml.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  local?: boolean;
  path: string;
  configKey: string;
  netlifyIdentity: boolean;
  extraHTML: string;
}

const defaults: Options = {
  path: "/admin/",
  configKey: "netlifycms",
  netlifyIdentity: false,
  extraHTML: "",
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (options.local === undefined) {
      options.local = site.options.location.hostname === "localhost";
    }

    // Run the local netlify server
    if (options.local) {
      site.addEventListener("afterBuild", () => {
        site.run("npx netlify-cms-proxy-server");
      });
    }

    // Build the admin page
    site.addEventListener("beforeSave", () => {
      const root = site.source.root!;
      const config: Record<string, unknown> =
        root.data[options.configKey] as Record<string, unknown> | undefined ||
        {};

      // Create config.yml
      const configUrl = posix.join(options.path, "config.yml");

      site.pages.push(Page.create(
        configUrl,
        stringify({
          local_backend: options.local,
          site_url: site.url("/", true),
          ...config,
        }),
      ));

      // Create index.html
      const body = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin</title>
      </head>
      <body>
      <link href="${site.url(configUrl)}" type="text/yaml" rel="cms-config-url">
      <script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>
      ${
        options.netlifyIdentity
          ? `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>`
          : ""
      }
      ${options.extraHTML || ""}
      </body>
      </html>
      `;

      site.pages.push(Page.create(
        posix.join(options.path, "index.html"),
        body,
      ));
    });
  };
}
