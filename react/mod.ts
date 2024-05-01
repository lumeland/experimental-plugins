import { Page } from "lume/core/file.ts";
import { merge } from "lume/core/utils/object.ts";
import esbuild from "lume/plugins/esbuild.ts";
import sourceMaps from "lume/plugins/source_maps.ts";
import { basename } from "lume/deps/path.ts";
import "lume/types.ts";

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];
}

export const defaults: Options = {
  extensions: [".jsx", ".tsx"],
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.process([".html"], (pages, allPages) => {
      let count = 0;
      for (const page of pages) {
        const apps = page.document!.querySelectorAll("[react-app]");
        for (const app of apps) {
          const src = app.getAttribute("react-app")!;
          app.removeAttribute("react-app");
          const id = app.getAttribute("id") || `react-app-${count++}`;
          const hydrate = app.hasAttribute("hydrate");

          app.setAttribute("id", id);
          const srcPage = allPages.find((page) => page.sourcePath === src);

          if (!srcPage) {
            throw new Error(`Page not found: ${src}`);
          }
          const mainUrl = srcPage.outputPath.replace(".tsx", ".main.tsx");

          const mainPage = Page.create({
            url: mainUrl,
            content: `
            import ReactDOMClient from "npm:react-dom/client";
            import App from "./${basename(srcPage.outputPath)}";

            function render() {
              ${
              hydrate
                ? `ReactDOMClient.hydrateRoot(document.getElementById("${id}"), <App />);`
                : `ReactDOMClient.createRoot(document.getElementById("${id}")).render(<App />);`
            }
            }

            render();
            `,
          });
          allPages.push(mainPage);

          const script = page.document!.createElement("script");
          script.setAttribute("type", "module");
          script.setAttribute("src", mainUrl.replace(".tsx", ".js"));
          page.document!.body.appendChild(script);
        }
      }
    });

    site.loadAssets([".jsx", ".tsx"]);

    site.use(esbuild({
      extensions: options.extensions,
    }));
    site.use(sourceMaps({ sourceContent: true }));
  };
}
