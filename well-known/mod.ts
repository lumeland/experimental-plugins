import type Site from "lume/core/site.ts";

export interface Options {
  /**
   * The AT Protocol ID to validate the domain as a handler
   * @see https://atproto.com/specs/handle#https-well-known-method
   */
  atProto?: string;

  /**
   * To define security policies
   * @see https://securitytxt.org/
   */
  security?: Security

  /**
   * To define the connections betweens website publishers and associations
   * @see https://journallist.net/reference-document-for-trust-txt-specifications
   */
  trust?: Trust

  /**
   * Indicates whether this site respect the Global Privacy Control signal
   */
  gpc?: boolean;

  /**
   * Migrate PWA from old domains
   */
  migratePWA?: string | string[];
}

interface Security {
  /** Urls, phone number or email address to contact about security issues */
  contact: string | string[];

  /** The date and time when the content of the security.txt file should be considered stale */
  expires: Date;

  /** Languages that your security team speaks. You may include more than one language */
  language?: string | string[];

  /** Links to web pages where you say thank you to security researchers who have helped you. */
  acknowledgments?: string | string[];

  /** Links to policy detailing what security researchers should do when searching for or reporting security issues */
  policy?: string | string[];

  /** One or more links to any security-related job openings in your organisation */
  hiring?: string | string[];

  /** Links to the provider-metadata.json of your CSAF (Common Security Advisory Framework) provider. */
  csaf?: string | string[];
}

interface Trust {
  /** URLs for members of any Association. */
  member?: string | string[];

  /** Associations or other organizations that a Publisher may belong to. */
  belongTo?: string | string[];

  /** A domain directly controlled by one entity. For use by ownership groups or other similar organizational units. */
  control?: string | string[];

  /** Domain of owner or other controlling entity.  */
  controlledBy?: string;

  /** Any social media account directly controlled by the Publisher. */
  social?: string | string[];

  /** URIs for a Vendor to any Association or Publisher. */
  vendor?: string | string[];

  /** Included here will be the URI for a Customer to any Vendor. */
  customer?: string | string[];

  /** If a Publisher has, for example, an ethics policy, it can publish the URI for that. */
  disclosure?: string | string[];

  /**
   * Contact information that can be in any form, including physical or email addresses, a URI, etc. 
   * As part of full transparency, Publishers or Associations may want to associate contact data
   * so that people who are part of Data Consumer organizations can make contact with questions.
   */
  contact?: string | string[];

  /**
   * Configure any scraper from an AI, a large language model, or any other tool designed to collect data from the
   * site of the publisher to be used in forms other than referring users to the site of origin
   */
  dataTrainingAllowed?: boolean;
}

export function wellKnown(options: Options) {
  return (site: Site) => {
    if (options.atProto) {
      site.page({
        url: "/.well-known/atproto-did",
        content: options.atProto,
      })
    }

    if (options.security) {
      site.page({
        url: "/.well-known/security.txt",
        content: buildSecurity(options.security, site.url("/.well-known/security.txt", true)),
      });
    }

    if (options.trust) {
      site.page({
        url: "/.well-known/trust.txt",
        content: buildTrust(options.trust),
      });
    }

    if (typeof options.gpc === "boolean") {
      site.page({
        url: "/.well-known/gpc.json",
        content: JSON.stringify({
          gpc: options.gpc,
          lastUpdate: Temporal.Now.plainDateISO(),
        }, null, 2),
      })
    }

    if (options.migratePWA) {
      const entries = toArray(options.migratePWA).map((domain) => [domain, { allow_migration: true }])
      site.page({
        url: "/.well-known/web-app-origin-association",
        content: JSON.stringify(Object.fromEntries(entries), null, 2),
      })
    }
  };
}

function buildSecurity(info: Security, canonical: string): string {
  const names = [
    "Contact",
    "Policy",
    "Acknowledgments",
    "Hiring",
    "CSAF",
  ];

  const lines: string[] = [];

  for (const name of names) {
    for (const value of toArray(info[name.toLowerCase() as keyof Security] as string | string[])) {
      lines.push(`${name}: ${value}`);
    }
  }

  lines.push(`Expires: ${info.expires.toISOString()}`);

  if (info.language) {
    lines.push(`Preferred-Languages: ${toArray(info.language).join(", ")}`);
  }

  lines.push(`Canonical: ${canonical}`);

  return lines.join("\n");
}

function buildTrust(info: Trust): string {
  const keys = [
    "member",
    "belongTo",
    "control",
    "social",
    "vendor",
    "customer",
    "disclosure",
    "contact",
    "dataTrainingAllowed",
  ];

  const lines: string[] = [];

  for (const key of keys) {
    for (const value of toArray(info[key as keyof Trust] as string | string[])) {
      lines.push(`${key.toLowerCase()}=${value}`);
    }
  }

  if (info.controlledBy) {
    lines.push(`controlledby=${info.controlledBy}`);
  }

  if (typeof info.dataTrainingAllowed === "boolean") {
    lines.push(`datatrainingallowed=${info.dataTrainingAllowed ? "yes" : "no"}`);
  }

  return lines.join("\n");
}

function toArray(v?: string | string[]): string[] {
  if (!v) {
    return [];
  }

  return Array.isArray(v) ? v : [v];
}

export default wellKnown;
