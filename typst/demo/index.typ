---
title: "Lume Typst"
outputs: [html, pdf]
templateEngine: [vto, typ]
---
#import "_components.typ": alert

= {{ title }}

This page serves as a living integration test and documentation for the custom `lume-typst` plugin. It is written entirely in `.typ` and rendered directly to HTML by Lume.

== 1. Vento Pre-processing
Because Vento pre-processing is enabled by default (`templateEngine: ["vto", "typ"]`), Lume data is interpolated before Typst compilation:

- *Page Title:* {{ title }}
- *Page Description:* {{ description }}
- *Build Time:* {{ new Date().toISOString() }}

== 2. Native Typst Features
Typst's math and styling engines compile natively for web output:

$ integral_0^infinity e^(-x^2) dif x = sqrt(pi)/2 $

== 3. Lume Metadata Integration (sys.inputs)
The plugin automatically passes core Lume page data to Typst via `sys.inputs`.

#let lume-data = json(bytes(sys.inputs.at("lume", default: "{}")))
- *Injected URL:* #lume-data.at("url", default: "unknown")
- *Target Format:* #sys.inputs.at("x-target", default: "html")
- *Custom Extracted Field:* #lume-data.at("customTestProperty", default: "missing")
- *Extracted Year:* #lume-data.at("formattedYear", default: "missing")

== 4. Local Workspace Imports
We can import local `.typ` files seamlessly. The following alert box is imported from an adjacent file:

#alert[
  This custom Typst component is successfully imported from `components.typ`!
]

== 5. Multi-format Outputs
The plugin can render the same source to multiple formats simultaneously using the `outputs` array. Check out the vector versions of the companion file:

- #link("/typst/vector.pdf")[View PDF Export]
- #link("/typst/vector.svg")[View SVG Export]
