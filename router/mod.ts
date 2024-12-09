import "lume/types.ts";

interface RouterParams {
  request: Request;
  [key: string]: unknown;
}

type RouteHandler<T = RouterParams> = (
  params: T,
) => Response | Promise<Response>;

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RouteDefinition {
  method: HTTPMethod;
  pattern: URLPattern;
  handler: RouteHandler;
}

export interface RouterOptions {
  location: string;
}

export default class Router {
  routes: RouteDefinition[] = [];
  options: RouterOptions;

  constructor(options: RouterOptions) {
    this.options = options;
  }

  add(method: HTTPMethod, pattern: URLPatternInput, handler: RouteHandler) {
    const { location } = this.options;
    this.routes.push({
      method,
      pattern: new URLPattern(pattern, location),
      handler,
    });
  }

  get(pattern: URLPatternInput, handler: RouteHandler) {
    this.add("GET", pattern, handler);
  }

  post(pattern: URLPatternInput, handler: RouteHandler) {
    this.add("POST", pattern, handler);
  }

  put(pattern: URLPatternInput, handler: RouteHandler) {
    this.add("PUT", pattern, handler);
  }

  delete(pattern: URLPatternInput, handler: RouteHandler) {
    this.add("DELETE", pattern, handler);
  }

  async exec(request: Request): Promise<Response | undefined> {
    for (const { method, pattern, handler } of this.routes) {
      if (request.method !== method) {
        continue;
      }

      const result = pattern.exec(request.url);

      if (result) {
        const data: Record<string, unknown> = {};
        Object.assign(data, result.pathname?.groups);
        Object.assign(data, result.search?.groups);

        return await handler({ ...data, request });
      }
    }
  }

  middleware(): Lume.Middleware {
    return async (request, next) => {
      const response = await this.exec(request);

      if (response) {
        return response;
      }

      return await next(request);
    };
  }
}
