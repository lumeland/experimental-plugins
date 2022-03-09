import { Page } from "lume/core/filesystem.ts";
import { merge } from "lume/core/utils.ts";
import { posix } from "lume/deps/path.ts";
import { stringify } from "lume/deps/yaml.ts";

import type { Site } from "lume/core.ts";

export interface Options {
  /** Path of a css file with custom styles for the preview */
  previewStyle?: string;

  /** Path of the admin */
  path: string;

  /** Data key of the configuration */
  configKey: string;

  /** Whether use Netlify Identity */
  netlifyIdentity: boolean;

  /** Custom HTML code to append in the index.html page */
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
    const local_backend = site.options.location.hostname === "localhost";

    // Run the local netlify server
    if (local_backend) {
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
          ...config,
          site_url: site.url("/", true),
          local_backend,
        }),
      ));

      // Create index.html
      const code = [];
      code.push(
        `<link href="${
          site.url(configUrl)
        }" type="text/yaml" rel="cms-config-url">`,
      );
      code.push(
        `<script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>`,
      );

      if (options.netlifyIdentity) {
        code.push(
          `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>`,
        );
      }

      if (options.extraHTML) {
        code.push(options.extraHTML);
      }

      if (options.previewStyle) {
        code.push(
          `<script>CMS.registerPreviewStyle("${
            site.url(options.previewStyle)
          }");</script>`,
        );
      }

      site.pages.push(Page.create(
        posix.join(options.path, "index.html"),
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admin</title>
        </head>
        <body>
        ${code.join("")}
        </body>
        </html>
        `,
      ));
    });
  };
}
