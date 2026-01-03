import { typeByExtension } from "jsr:@std/media-types@1.1.0/type-by-extension";
import {
  stringify,
  type stringifyable,
} from "https://deno.land/x/xml@7.0.3/mod.ts";

/**
 * OPF - Open Packaging Format for eBooks
 * @see https://idpf.org/epub/30/spec/epub30-publications.html
 */

/**
 * Allowed roles for creators and contributors
 * @see https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#TOC2.2.6
 */
export type Role =
  | "adp"
  | "ann"
  | "arr"
  | "art"
  | "asn"
  | "aut"
  | "aqt"
  | "aft"
  | "aui"
  | "ant"
  | "bkp"
  | "clb"
  | "cmm"
  | "dsr"
  | "edt"
  | "ill"
  | "lyr"
  | "mdc"
  | "mus"
  | "nrt"
  | "oth"
  | "pht"
  | "prt"
  | "red"
  | "rev"
  | "spn"
  | "ths"
  | "trc"
  | "trl";

export interface Contributor {
  /** Name of the contributor */
  name: string;

  /** Role of the contributor */
  role?: Role;

  /** Used to specify a normalized form of the contents, suitable for machine processing */
  fileAs?: string;
}

export interface Metadata {
  /** Unique identifier for the package */
  identifier: string;

  /** Title of the publication */
  title: string;

  /** The creators of the publication */
  creator?: (string | Contributor)[];

  /** The subjects of the publication, including an arbitrary phrase or keyword */
  subject?: string[];

  /** Description of the publication's content. */
  description: string;

  /** Name of the publisher */
  publisher: string;

  /** Names of contributors to the publication */
  contributor?: (string | Contributor)[];

  /** Date of publication */
  date: Date;

  /** Language of the publication */
  language?: string;

  /** A statement about rights, or a reference to one. */
  rights: string;
}

export interface Files {
  /** Location of the file */
  href: string;

  /**
   * Unique identifier for the file
   * If not provided, it will be generated.
   */
  id?: string;

  /**
   * Media type of the file.
   * If not provided, it will be inferred from the file extension.
   */
  mediaType?: string;

  /** Indicates if the file is auxiliary (not present in the linear reading order) */
  auxiliary?: boolean;
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  auxiliary: boolean;
}

interface SpineItem {
  idref: string;
  linear: boolean;
}

export interface OPF {
  metadata: Metadata;
  files: Files[];
}

export function createOPF(opf: OPF) {
  const { metadata, files } = opf;

  const manifest: ManifestItem[] = files.map((file, index) => ({
    id: file.id ?? `item${index + 1}`,
    href: file.href,
    mediaType: file.mediaType ?? getMediaType(file.href),
    auxiliary: file.auxiliary ?? false,
  }));

  const spine: SpineItem[] = manifest
    .filter((item) => item.mediaType === "application/xhtml+xml")
    .map((item) => ({
      idref: item.id,
      linear: !item.auxiliary,
    }));

  const ncxItem = manifest.find((item) =>
    item.mediaType === "application/x-dtbncx+xml"
  );

  const xmlObj: stringifyable = {
    "@version": "1.0",
    "@encoding": "UTF-8",
    package: {
      "@xmlns": "http://www.idpf.org/2007/opf",
      "@version": "3.0",
      "@xml:lang": metadata.language ?? "en-US",
      "@unique-identifier": "uid",
      "@dir": "ltr",
      metadata: {
        "@xmlns:dc": "http://purl.org/dc/elements/1.1/",

        // Dublin Core Metadata
        "dc:identifier": {
          "@id": "uid",
          "#text": metadata.identifier,
        },
        "dc:date": {
          "#text": metadata.date.toISOString(),
        },
        "dc:rights": {
          "#text": metadata.rights,
        },
        "dc:publisher": {
          "@id": "publisher",
          "#text": metadata.publisher,
        },
        "dc:title": {
          "@id": "title",
          "#text": metadata.title,
        },
        "dc:description": {
          "@id": "description",
          "#text": metadata.description,
        },
        "dc:subject": metadata.subject?.map((subject, index) => ({
          "@id": `subject-${index + 1}`,
          "#text": subject,
        })) || [],
        "dc:language": {
          "#text": metadata.language ?? "en-US",
        },
        "dc:creator":
          metadata.creator?.map((creator, index) =>
            typeof creator === "string"
              ? {
                "@id": `creator-${index + 1}`,
                "#text": creator,
              }
              : {
                "@id": `creator-${index + 1}`,
                "#text": creator.name,
                "@role": creator.role,
                "@file-as": creator.fileAs,
              }
          ) || [],
        "dc:contributor":
          metadata.contributor?.map((contributor, index) =>
            typeof contributor === "string"
              ? {
                "@id": `contributor-${index + 1}`,
                "#text": contributor,
              }
              : {
                "@id": `contributor-${index + 1}`,
                "#text": contributor.name,
                "@role": contributor.role,
                "@file-as": contributor.fileAs,
              }
          ) || [],
        "link": {
          "@rel": "dcterms:conformsTo",
          "@href":
            "http://idpf.org/epub/a11y/accessibility-20170105.html#wcag-aa",
        },

        // Additional Metadata
        "meta": [
          {
            "@property": "file-as",
            "@refines": "#publisher",
            "#text": metadata.publisher,
          },
          {
            "@property": "a11y:certifiedBy",
            "#text": metadata.creator?.join(", "),
          },
          {
            "@property": "schema:accessMode",
            "#text": "textual",
          },
          {
            "@property": "schema:accessModeSufficient",
            "#text": "textual",
          },
        ],
      },
      manifest: {
        item: manifest.map((item) => {
          const manifestItem: stringifyable = {
            "@id": item.id,
            "@href": item.href,
            "@media-type": item.mediaType,
          };
          return manifestItem;
        }),
      },
      spine: {
        "@toc": ncxItem?.id,
        itemref: spine.map((item) => {
          const spineItem: stringifyable = {
            "@idref": item.idref,
          };
          if (!item.linear) {
            spineItem["@linear"] = "no";
          }
          return spineItem;
        }),
      },
    },
  };

  return stringify(clean(xmlObj));
}

export function createContainer(path: string) {
  const xmlObj: stringifyable = {
    "@version": "1.0",
    "@encoding": "UTF-8",
    container: {
      "@xmlns": "urn:oasis:names:tc:opendocument:xmlns:container",
      "@version": "1.0",
      rootfiles: {
        rootfile: {
          "@full-path": path,
          "@media-type": "application/oebps-package+xml",
        },
      },
    },
  };

  return stringify(clean(xmlObj));
}

function getMediaType(file: string): string {
  const extension = file.split(".").pop()?.toLowerCase();

  if (!extension) {
    return "application/octet-stream";
  }

  switch (extension) {
    case "xhtml":
    case "html":
    case "htm":
      return "application/xhtml+xml";
    case "ncx":
      return "application/x-dtbncx+xml";
    default:
      return typeByExtension(extension) || "application/octet-stream";
  }
}

/** Remove undefined values of an object recursively */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([key, value]): [string, unknown] => {
        if (isPlainObject(value)) {
          const cleanValue = clean(value);
          return [
            key,
            Object.keys(cleanValue).length > 0 ? cleanValue : undefined,
          ];
        }
        if (Array.isArray(value)) {
          const cleanValue = value
            .map((v) => isPlainObject(v) ? clean(v) : v)
            .filter((v) => v !== undefined);
          return [
            key,
            cleanValue.length > 0 ? cleanValue : undefined,
          ];
        }
        return [key, value];
      })
      .filter(([, value]) => value !== undefined),
  );
}

const objectConstructor = {}.constructor;
export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null &&
    (obj.constructor === objectConstructor || obj.constructor === undefined);
}
