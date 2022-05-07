import { createReporter } from "./deps.ts";
import { merge } from "https:/deno.land/x/lume/core/utils.ts";

import type { Middleware, RequestHandler } from "lume/core.ts";
import type { ReporterOptions } from "./deps.ts";

export type Options = ReporterOptions;

export const defaults: Options = {
  filter(_request, response) {
    return [200, 304].includes(response.status) &&
      !!response.headers.get("content-type")?.includes("text/html");
  },
};

export default function GoogleAnalytics(
  userOptions?: Partial<Options>,
): Middleware {
  const options = merge(defaults, userOptions);
  const reporter = createReporter(options);

  return async (request: Request, next: RequestHandler, connInfo) => {
    const start = performance.now();
    const response = await next(request);

    reporter(request, connInfo, response, start);

    return response;
  };
}
