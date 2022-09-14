import type { Middleware, RequestHandler } from "lume/core.ts";
import { isPlainObject, merge } from "lume/core/utils.ts";

const DEFAULT_MAX_AGE = 365 * 86400;

interface StrictTransportSecurityOptions {
  /** The time, in seconds, that the browser should remember that a site is only to be accessed using HTTPS */
  maxAge: number;

  /** If this optional parameter is specified, this rule applies to all of the site's subdomains as well */
  includeSubDomains?: boolean;

  /** Enable preloading for assets (https://hstspreload.org/) */
  preload?: boolean;
}

interface ContentSecurityPolicyOptions {
  mergeDefaults?: boolean;
  directives: ContentSecurityPolicyDirectives;
  reportOnly?: boolean;
}

interface ContentSecurityPolicyDirectives {
  /** Defines valid sources for web workers and nested browsing contexts loaded using elements */
  "child-src"?: string;

  /** Applies to XMLHttpRequest (AJAX), WebSocket, fetch(), <a ping> or EventSource */
  "connect-src"?: string[];

  /** Defines the default policy for fetching resources */
  "default-src"?: string[];

  /** Defines valid sources of font resources (loaded via @font-face) */
  "font-src"?: string[];

  /** Defines valid sources for loading frames */
  "frame-src"?: string[];

  /** Defines valid sources of images */
  "img-src"?: string[];

  /** Restricts the URLs that application manifests can be loaded */
  "manifest-src"?: string[];

  /** Defines valid sources of audio and video, eg HTML5 <audio>, <video> elements */
  "media-src"?: string[];

  /** Defines valid sources of plugins, eg <object>, <embed> or <applet> */
  "object-src"?: string[];

  /** Defines valid sources for request prefetch and prerendering */
  "prefetch-src"?: string[];

  /** Defines valid sources of JavaScript */
  "script-src"?: string[];

  /** Defines valid sources for JavaScript <script> elements, but not inline script event handlers */
  "script-src-elem"?: string[];

  /** Defines valid sources for JavaScript inline event handlers */
  "script-src-attr"?: string[];

  /** Defines valid sources of stylesheets or CSS */
  "style-src"?: string[];

  /** Defines valid sources for stylesheets <style> elements and <link> elements with rel="stylesheet" */
  "style-src-elem"?: string[];

  /** Defines valid sources for inline styles applied to individual DOM elements */
  "style-src-attr"?: string[];

  /** Restricts the URLs which may be loaded as a Worker, SharedWorker or ServiceWorker */
  "worker-src"?: string[];

  /** Defines a set of allowed URLs which can be used in the src attribute of a HTML base tag */
  "base-uri"?: string[];

  /** Defines valid MIME types for plugins invoked via <object> and <embed> */
  "plugin-types"?: string[];

  /** Enables a sandbox for the requested resource similar to the iframe sandbox attribute */
  "sandbox"?: string[];

  /** Defines valid sources that can be used as an HTML <form> action */
  "form-action"?: string[];

  /** Defines valid sources for embedding the resource using <frame> <iframe> <object> <embed> <applet> */
  "frame-ancestors"?: string[];

  /** Restricts the URLs that the document may navigate to by any means */
  "navigate-to"?: string[];

  /** Instructs the browser to POST a reports of policy failures to this URI */
  "report-uri"?: string;

  /** Defines a reporting group name defined by a Report-To HTTP response header */
  "report-to"?: string;

  /**
   * Deprecated:
   * Prevents loading any assets over HTTP when the page uses HTTPS
   */
  "block-all-mixed-content"?: string[];

  /**
   * Deprecated:
   * Used to specify information in the Referer header for links away from a page
   */
  "referrer"?: [
    "no-referrer",
    "no-referrer-when-downgrade",
    "origin",
    "origin-when-cross-origin",
    "unsafe-url",
  ];

  /**
   * Deprecated:
   * Instructs the client to require the use of Subresource Integrity for scripts or styles on the page
   */
  "require-sri-for"?: string[];

  /**
   * Experimental:
   * Instructs user agents to control the data passed to DOM XSS sink functions
   */
  "require-trusted-types-for"?: string[];

  /**
   * Experimental:
   * Instructs user agents to restrict the creation of Trusted Types policies
   */
  "trusted-types"?: string[];

  /** Instructs user agents to treat all of a site's insecure URLs */
  "upgrade-insecure-requests"?: boolean;
}

interface ReportToOptions {
  "group": string;
  "max_age": number;
  "endpoints": { "url": string }[];
  "include_subdomains": boolean;
}

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

interface ExpectCtOptions {
  /**
   * The number of seconds after reception of the Expect-CT header field during which the
   * user agent should regard the host of the received message as a known Expect-CT host
   */
  maxAge: number;
  /** The URI where the user agent should report Expect-CT failures */
  enforce?: boolean;
  /** Signals to the user agent that compliance with the Certificate Transparency policy
   * should be enforced
   */
  reportUri?: string;
}

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

  /** Allows to restrict resources that the web browser loads */
  "Content-Security-Policy"?: ContentSecurityPolicyOptions;

  /** New header v1: Specifies a reporting group to which violation reports ought to be sent */
  "Reporting-Endpoints"?: string;

  /** Legacy header v0: Specifies a reporting group to which violation reports ought to be sent */
  "Report-To"?: ReportToOptions;

  /** Controls how much referrer information should be included with requests */
  "Referrer-Policy"?: ReferrerPolicyOptions | ReferrerPolicyOptions[];

  /** Specifies which features of the web browser should be permitted to function */
  "Permissions-Policy"?: string;

  /** Prevents the use of misissued certificates */
  "Expect-CT"?: ExpectCtOptions;

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

// default config
export const defaults: Options = {
  "Strict-Transport-Security": {
    maxAge: DEFAULT_MAX_AGE,
    includeSubDomains: true,
    preload: true,
  },
  "Referrer-Policy": ["no-referrer", "strict-origin-when-cross-origin"],
  "X-Frame-Options": true,
  "X-Content-Type-Options": true,
  "X-XSS-Protection": true,
  "X-Permitted-Cross-Domain-Policies": true,
  "X-Powered-By": false,
};

/** A middleware to help secure your application */
export default function csp(userOptions?: Partial<Options>): Middleware {
  const options = merge(defaults, userOptions);

  if (!options["Content-Security-Policy"]?.mergeDefaults) {
    // todo remove obj
  }

  return async (request: Request, next: RequestHandler) => {
    const response = await next(request);
    const { headers } = response;

    if (options["Strict-Transport-Security"]) {
      const strictTranportSecurity = stringifyStrictTransportSecurity(
        options["Strict-Transport-Security"],
      );

      headers.set("Strict-Transport-Security", strictTranportSecurity!);
    }

    if (
      options["Referrer-Policy"] &&
      headers.get("content-type")?.includes("html")
    ) {
      const referrerPolicy = stringifyReferrerPolicy(
        options["Referrer-Policy"],
      );

      headers.set("Referrer-Policy", referrerPolicy!);
    }

    if (
      typeof options["Permissions-Policy"] === "string" &&
      headers.get("content-type")?.includes("html")
    ) {
      headers.set("Permissions-Policy", options["Permissions-Policy"]);
    }

    if (options["Expect-CT"]) {
      const expectCt = stringifyExpectCt(options["Expect-CT"]);

      headers.set("Expect-CT", expectCt!);
    }

    if (typeof options["X-Frame-Options"] === "string") {
      headers.set("X-Frame-Options", options["X-Frame-Options"]);
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
        options["X-Permitted-Cross-Domain-Policies"],
      );
    } else if (options["X-Permitted-Cross-Domain-Policies"] !== false) {
      headers.set("X-Permitted-Cross-Domain-Policies", "none");
    }

    if (typeof options["X-Powered-By"] === "string") {
      headers.set("X-Powered-By", options["X-Powered-By"]);
    } else if (options["X-Powered-By"] !== false) {
      headers.delete("X-Powered-By");
    }

    if (
      options["Reporting-Endpoints"] &&
      headers.get("content-type")?.includes("html")
    ) {
      headers.set("Reporting-Endpoints", options["Reporting-Endpoints"]);
    }

    if (
      isPlainObject(options["Report-To"]) &&
      headers.get("content-type")?.includes("html")
    ) {
      headers.set("Report-To", JSON.stringify(options["Report-To"]));
    }

    if (
      options["Content-Security-Policy"] &&
      headers.get("content-type")?.includes("html")
    ) {
      let contentSecurityPolicy = stringifyContentSecurityPolicy(
        options["Content-Security-Policy"]["directives"],
      );

      let newBody;

      if (contentSecurityPolicy.includes("'nonce'")) {
        const nonce = crypto.randomUUID().replace(/-/g, "");

        contentSecurityPolicy = contentSecurityPolicy.replace(
          /\'nonce\'/g,
          `'nonce-${nonce}'`,
        );

        const body = await response.text();

        if (body) {
          newBody = body.replace(
            /<(script|style)/g,
            '<$1 nonce="' + nonce + '"',
          );
        }
      }

      headers.set(
        options["Content-Security-Policy"]["reportOnly"]
          ? "Content-Security-Policy-Report-Only"
          : "Content-Security-Policy",
        contentSecurityPolicy,
      );

      if (typeof newBody !== "undefined") {
        return new Response(newBody, {
          status: 200,
          headers,
        });
      }
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

function stringifyStrictTransportSecurity(
  options: Readonly<StrictTransportSecurityOptions>,
): string {
  const headerValue: string[] = [
    `max-age=${validateMaxAge(options.maxAge)}`,
  ];

  if (typeof options.includeSubDomains !== "boolean") {
    throw new Error(
      "CSP Middleware: includeSubDomains must be type of boolean",
    );
  }

  if (typeof options.preload !== "boolean") {
    throw new Error("CSP Middleware: preload must be type of boolean");
  }

  if (options.includeSubDomains) {
    headerValue.push("includeSubDomains");
  }

  if (options.preload) {
    headerValue.push("preload");
  }

  return headerValue.join("; ");
}

function stringifyContentSecurityPolicy(
  options: Readonly<
    Partial<ContentSecurityPolicyOptions["directives"]>
  >,
): string {
  const headerValue = Object
    .keys(options)
    .reduce((acc: string[], directive: string) => {
      const policy = options[directive as keyof typeof options];

      if (Array.isArray(policy) && policy.length > 0) {
        acc.push(`${directive} ${policy.join ? policy.join(" ") : policy}; `);
      } else if (typeof policy === "boolean") {
        acc.push(`${directive}; `);
      } else if (typeof policy === "string") {
        acc.push(`${directive} ${policy}; `);
      } else {
        throw new Error(
          `CSP Middleware: Invalid directive in ContentSecurityPolicyOptions: ${
            directive ? directive : ""
          }`,
        );
      }

      return acc;
    }, [])
    .join("")
    .slice(0, -2);

  return headerValue;
}

function stringifyReferrerPolicy(
  options: Readonly<ReferrerPolicyOptions | ReferrerPolicyOptions[]>,
): string {
  const headerValue = typeof options === "string" ? [options] : options;

  if (headerValue?.length === 0) {
    throw new Error("CSP Middleware: Referrer-Policy is enabled but empty");
  }

  return headerValue.join(", ");
}

function stringifyExpectCt(options: Readonly<ExpectCtOptions>): string {
  const headerValue: string[] = [
    `max-age=${validateMaxAge(options.maxAge)}`,
  ];

  if (typeof options.enforce !== "boolean") {
    throw new Error(
      "CSP Middleware: includeSubDomains must be type of boolean",
    );
  }

  if (typeof options.reportUri !== "string") {
    throw new Error(
      "CSP Middleware: includeSubDomains must be type of boolean",
    );
  }

  if (options.enforce) {
    headerValue.push("enforce");
  }

  if (options.reportUri) {
    headerValue.push(`report-uri="${options.reportUri}"`);
  }

  return headerValue.join(", ");
}
