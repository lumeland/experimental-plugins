import "lume/types.ts";

export interface Options {
  origin: string | string[];
}

const isRequestedByFormElementRe =
  /^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/;

/**
 * CSRF protection middleware.
 * Code adapted from: https://github.com/honojs/hono/blob/main/src/middleware/csrf/index.ts
 */
export default function csrf(options: Options): Lume.Middleware {
  const allowedOrigins = typeof options.origin === "string"
    ? [options.origin]
    : options.origin;

  return async (request: Request, next) => {
    const method = request.method;
    const type = request.headers.get("content-type") || "";
    const origin = request.headers.get("origin") || "";

    if (
      !["GET", "HEAD"].includes(method) &&
      isRequestedByFormElementRe.test(type) &&
      !allowedOrigins.includes(origin)
    ) {
      return new Response("Forbidden", {
        status: 403,
      });
    }

    return await next(request);
  };
}
