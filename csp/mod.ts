import type { Middleware, RequestHandler } from "lume/core.ts";
import { merge } from "lume/core/utils.ts";

const DEFAULT_MAX_AGE = 365 * 86400;

type StrictTransportSecurityOptions = {
  "max-age": number;
  "includeSubDomains"?: boolean;
  "preload"?: boolean;
};

export interface Options {
  /** Enforces SSL connections */
  "Strict-Transport-Security"?: StrictTransportSecurityOptions;
}

export const defaults: Options = {
  "Strict-Transport-Security": {
    "max-age": DEFAULT_MAX_AGE,
    "includeSubDomains": true,
    "preload": true,
  },
};

/** A middleware to help secure your application */
export default function csp(userOptions?: Partial<Options>): Middleware {
  const options = merge(defaults, userOptions);

  return async (request: Request, next: RequestHandler) => {
    const response = await next(request);
    const { headers } = response;

    if (options["Strict-Transport-Security"]) {
      const strictTranportSecurity = getStrictTransportSecurity(
        options["Strict-Transport-Security"],
      );

      headers.set("Strict-Transport-Security", strictTranportSecurity!);
    }

    return response;
  };
}

function validateMaxAge(maxAge: number): number {
  if (typeof maxAge !== "number" || maxAge < 0) {
    throw new Error(
      "CSP Middleware: maxAge must be type number and a positive value",
    );
  }

  if (maxAge === null || maxAge === undefined) {
    return DEFAULT_MAX_AGE;
  }

  return maxAge;
}

function getStrictTransportSecurity(
  options: Readonly<StrictTransportSecurityOptions>,
): string {
  const headerValue: string[] = [
    `max-age=${validateMaxAge(options["max-age"])}`,
  ];

  if (options.includeSubDomains) {
    headerValue.push("includeSubDomains");
  }

  if (options.preload) {
    headerValue.push("preload");
  }

  return headerValue.join("; ");
}
