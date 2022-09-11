import type { Middleware, RequestHandler } from "lume/core.ts";
import { merge } from "lume/core/utils.ts";

export interface Options {
  filter: (request: Request, response: Response) => boolean;
}

export const defaults: Options = {
  filter(_, response: Response) {
    return response.ok;
  },
};

export default function FsCache(userOptions?: Partial<Options>): Middleware {
  const options = merge(defaults, userOptions);
  const cache = new Map<string, Response>();

  return async (request: Request, next: RequestHandler): Promise<Response> => {
    if (cache.has(request.url)) {
      return cache.get(request.url)!.clone();
    }

    const response = await next(request);

    if (options.filter(request, response)) {
      cache.set(request.url, response);
    }

    return response.clone();
  };
}
