---
title: Vector Exports
outputs: ["html", "pdf", "svg"]
url: /typst/vector.html
---
#set page(width: 400pt, height: 200pt, margin: 20pt) if sys.inputs.at("x-target", default: "html") != "html"

// Use our newly injected remote font!
#set text(font: "Pacifico", size: 14pt)

= Vector Export Test

This source file automatically generates `/typst/vector.html`, `/typst/vector.pdf`, and `/typst/vector.svg`.

#let target = sys.inputs.at("x-target", default: "html")

Current render target: *#target*

#if target == "pdf" [
  *PDF ONLY:* This block proves the compiler recognized the `.pdf` render pass.
] else if target == "svg" [
  *SVG ONLY:* This block proves the compiler recognized the `.svg` render pass.
] else [
  *HTML ONLY:* This text appears when viewing the standard web route.
]
