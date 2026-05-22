import { merge } from "lume/core/utils/object.ts";
import Site from "lume/core/site.ts";
import { posix } from "lume/deps/path.ts";

const allTags = [
  "wa-animated-image",
  "wa-animation",
  "wa-avatar",
  "wa-badge",
  "wa-bar-chart",
  "wa-breadcrumb",
  "wa-breadcrumb-item",
  "wa-bubble-chart",
  "wa-button",
  "wa-button-group",
  "wa-callout",
  "wa-card",
  "wa-carousel",
  "wa-carousel-item",
  "wa-chart",
  "wa-checkbox",
  "wa-color-picker",
  "wa-combobox",
  "wa-comparison",
  "wa-copy-button",
  "wa-details",
  "wa-dialog",
  "wa-divider",
  "wa-doughnut-chart",
  "wa-drawer",
  "wa-dropdown",
  "wa-dropdown-item",
  "wa-file-input",
  "wa-format-bytes",
  "wa-format-date",
  "wa-format-number",
  "wa-icon",
  "wa-include",
  "wa-input",
  "wa-intersection-observer",
  "wa-line-chart",
  "wa-markdown",
  "wa-mutation-observer",
  "wa-number-input",
  "wa-option",
  "wa-page",
  "wa-pie-chart",
  "wa-polar-area-chart",
  "wa-popover",
  "wa-popup",
  "wa-progress-bar",
  "wa-progress-ring",
  "wa-qr-code",
  "wa-radar-chart",
  "wa-radio",
  "wa-radio-group",
  "wa-rating",
  "wa-relative-time",
  "wa-resize-observer",
  "wa-scatter-chart",
  "wa-scroller",
  "wa-select",
  "wa-skeleton",
  "wa-slider",
  "wa-sparkline",
  "wa-spinner",
  "wa-split-panel",
  "wa-switch",
  "wa-tab",
  "wa-tab-group",
  "wa-tab-panel",
  "wa-tag",
  "wa-textarea",
  "wa-toast",
  "wa-toast-item",
  "wa-tooltip",
  "wa-tree",
  "wa-tree-item",
  "wa-video",
  "wa-video-playlist",
  "wa-zoomable-frame",
];

const specifier = "npm:@awesome.me/webawesome@3.7.0/dist-cdn"

export interface Options {
  outputPath?: string,
  theme?: "default",
  styles?: "native" | "utilities" | "all",
}

export const defaults: Options = {
  outputPath: "webawesome",
  theme: "default",
  styles: "all",
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const { outputPath, theme, styles } = options;

  return (site: Site) => {
    // Copy all assets
    site.copy(`${specifier}/**/*{.js,.css}`, outputPath);

    site.process([".html"], async (pages) => {
      for (const page of pages) {
        const { document } = page;

        const styles = document.createElement("link");
        styles.setAttribute("rel", "stylesheet");
        styles.setAttribute(
          "href",
          site.url(
            `${posix.join(options.outputPath, "styles/webawesome.css")}`,
          ),
        );

        // Insert before other styles to allow overriding
        const first = document.head.querySelector(
          "link[rel=stylesheet],style",
        );
        if (first) {
          document.head.insertBefore(styles, first);
        } else {
          document.head.append(styles);
        }

        const script = document.createElement("script");
        script.setAttribute("type", "module");
        script.setAttribute(
          "src",
          site.url(
            `${posix.join(options.outputPath, "webawesome.loader.js")}`,
          ),
        );
        document.head.append(script);
      }
    });
  };
}
