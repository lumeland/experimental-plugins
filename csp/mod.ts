import type { Middleware, RequestHandler } from "lume/core.ts";
import { merge } from "lume/core/utils.ts";

const DEFAULT_MAX_AGE = 365 * 86400;

type StrictTransportSecurityOptions = {
  "max-age": number;
  "includeSubDomains"?: boolean;
  "preload"?: boolean;
};

type ReferrerPolicyOptions =
  | ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "unsafe-url"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "origin"
  | "origin-when-cross-origin";

type XFrameOptions = "DENY" | "SAMEORIGIN" | boolean | string;

type XPermittedCrossDomainPoliciesOptions =
  | "none"
  | "master-only"
  | "all"
  | boolean
  | string;

export interface Options {
  /** Enforces SSL connections */
  "Strict-Transport-Security"?: StrictTransportSecurityOptions;

  /** Controls how much referrer information should be included with requests */
  "Referrer-Policy"?: ReferrerPolicyOptions | ReferrerPolicyOptions[];

  /** Clickjacking protection */
  "X-Frame-Options"?: XFrameOptions;

  /** MIME sniffing vulnerabilities protection */
  "X-Content-Type-Options"?: boolean;

  /**  Cross-site scripting (XSS) filter */
  "X-XSS-Protection"?: boolean;

  /** Restricts loading of Adobe Flash or PDF documents from other domains */
  "X-Permitted-Cross-Domain-Policies"?: XPermittedCrossDomainPoliciesOptions;

  /** Leaks or fakes information about the server side technology */
  "X-Powered-By"?: boolean | string;
}

export const defaults: Options = {
  "Strict-Transport-Security": {
    "max-age": DEFAULT_MAX_AGE,
    "includeSubDomains": true,
    "preload": true,
  },
  "Referrer-Policy": ["no-referrer", "strict-origin-when-cross-origin"],
  "X-Frame-Options": true,
  "X-Content-Type-Options": true,
  "X-XSS-Protection": true,
  "X-Permitted-Cross-Domain-Policies": true,
  "X-Powered-By": "Fake Server",
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

    if (options["Referrer-Policy"]) {
      const referrerPolicy = getReferrerPolicy(options["Referrer-Policy"]);

      headers.set("Referrer-Policy", referrerPolicy!);
    }

    if (typeof options["X-Frame-Options"] === "string") {
      headers.set("X-Frame-Options", options["X-Frame-Options"] as string);
    } else if (options["X-Frame-Options"] !== false) {
      headers.set("X-Frame-Options", "SAMEORIGIN");
    }

    if (options["X-Content-Type-Options"]) {
      headers.set("X-Content-Type-Options", "nosniff");
    }

    if (options["X-XSS-Protection"]) {
      headers.set("X-XSS-Protection", "1; mode=block");
    }

    if (typeof options["X-Permitted-Cross-Domain-Policies"] === "string") {
      headers.set(
        "X-Permitted-Cross-Domain-Policies",
        options["X-Permitted-Cross-Domain-Policies"] as string,
      );
    } else if (options["X-Permitted-Cross-Domain-Policies"] !== false) {
      headers.set("X-Permitted-Cross-Domain-Policies", "none");
    }

    if (typeof options["X-Powered-By"] === "string") {
      headers.set("X-Powered-By", options["X-Powered-By"] as string);
    } else if (options["X-Powered-By"] !== false) {
      headers.delete("X-Powered-By");
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

function getReferrerPolicy(
  options: Readonly<ReferrerPolicyOptions | ReferrerPolicyOptions[]>,
): string {
  const headerValue = typeof options === "string" ? [options] : options;

  if (headerValue?.length === 0) {
    throw new Error("CSP Middleware: Referrer-Policy is enabled but empty");
  }

  return headerValue.join(", ");
}
