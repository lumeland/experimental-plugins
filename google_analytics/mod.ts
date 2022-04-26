import { createReporter } from "./deps.ts";

import type { Middleware, RequestHandler } from "lume/core.ts";
import type { ReporterOptions } from "./deps.ts";

export type Options = ReporterOptions;

export default function GoogleAnalytics(options?: Options): Middleware {
  const reporter = createReporter(options);

  return async (request: Request, next: RequestHandler, connInfo) => {
    const start = performance.now();
    const response = await next(request);

    reporter(request, connInfo, response, start);

    return response;
  };
}
