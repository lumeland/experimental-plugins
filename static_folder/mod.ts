import { posix } from "lume/deps/path.ts";
import { serveFile } from "lume/deps/http.ts";

import type { Middleware, RequestHandler } from "lume/core.ts";

/** The options to configure the middleware server */
export interface Options {
  /** The root path */
  root: string;
}

export default function staticFolder(options: Options): Middleware {
  return async function (
    request: Request,
    next: RequestHandler,
  ): Promise<Response> {
    const response = await serve(request);
    const status = response?.status ?? 404;

    if (response && status < 400) {
      return response;
    }

    return next(request);
  };

  async function serve(request: Request): Promise<Response | undefined> {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const path = posix.join(options.root, pathname);

    try {
      const file = path.endsWith("/") ? path + "index.html" : path;

      // Redirect /example to /example/
      const info = await Deno.stat(file);

      if (info.isDirectory) {
        return new Response(null, {
          status: 301,
          headers: {
            location: posix.join(pathname, "/"),
          },
        });
      }

      // Serve the static file
      return await serveFile(request, file);
    } catch {
      try {
        // Exists a HTML file with this name?
        if (!posix.extname(path)) {
          return await serveFile(request, path + ".html");
        }
      } catch {
        // Continue
      }
    }
  }
}
