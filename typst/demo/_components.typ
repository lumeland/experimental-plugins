#let alert(body) = context {
  if target() == "html" {
    html.elem(
      "div",
      attrs: (
        style: "background-color: #f0f4f8; border-left: 4pt solid #0074d9; padding: 12pt; border-radius: 4pt; margin: 12pt 0;",
      ),
    )[
      *Note:* #body
    ]
  } else {
    rect(
      fill: rgb("f0f4f8"),
      stroke: (left: 4pt + rgb("0074d9")),
      inset: 12pt,
      radius: 4pt,
      width: 100%,
      [ *Note:* #body ],
    )
  }
}
