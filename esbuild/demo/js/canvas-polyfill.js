// canvas-polyfill.js
"use strict";

import boxBlurCanvasRGBA from "./lib/canvasFastBoxBlur.js";

const polyfilled = globalThis.canvasPolyfill = new Set();

export default function polyfillWarning(target) {
  if (polyfilled.size == 0) return;

  const d = document.createElement("div");
  d.id = "polyfillWarning";

  const polys = [];
  for (const v of polyfilled) {
    if (v == "OffscreenCanvas") {
      polys.push(
        `<a href='https://caniuse.com/mdn-api_offscreencanvasrenderingcontext2d'>OffscreenCanvas</a>`,
      );
    } else if (v == "CanvasFilter") {
      polys.push(`CanvasFilter`);
    } else if (v == "roundRect") {
      polys.push(`Canvas2D.roundRect`);
    } else if (v == "reset") {
      polys.push(`Canvas2D.reset`);
    } else if (v == "filter") {
      polys.push(
        `<a href='https://caniuse.com/mdn-api_canvasrenderingcontext2d_filter'>Canvas2D.filter</a>`,
      );
    } else {
      polys.push(v);
    }
  }

  let browser = "";
  if (navigator.userAgent.indexOf("Safari") > -1) browser = "Safari";
  if (navigator.userAgent.indexOf("Chrome") > -1) browser = "Chrome";
  if (navigator.userAgent.indexOf("Firefox") > -1) browser = "Firefox";
  if (navigator.userAgent.indexOf("MSIE") > -1) browser = "Internet Explorer";

  let html = `
<p>The following features are not supported by your browser and were
<a href='https://developer.mozilla.org/en-US/docs/Glossary/Polyfill'>polyfilled</a>:
${polys.join(", ")}.
<br><br>
<p>Because of this, performance may degrade and some features may not fully work.
<br><br>
`;

  if (browser == "Safari") {
    html +=
      `<p>Consider <a href='https://www.apple.com/feedback/safari.html'>leaving feedback for the Safari team</a> to implement them.`;
  } else if (browser == "Firefox") {
    html +=
      `<p>Consider <a href='https://bugzilla.mozilla.org/enter_bug.cgi?product=Firefox'>leaving feedback for the Firefox team</a> to implement them.`;
  } else if (browser == "Chrome") {
    html +=
      `<p>Consider <a href='https://www.google.com/chrome/update/'>upgrading Google Chrome</a>.`;
  } else {
    html +=
      `<p>Consider <a href='https://www.google.com/intl/en_ca/chrome/'>upgrading to a more modern browser</a>.`;
  }

  if (browser != "Chrome") {
    html +=
      `<p>Meanwhile, you can check these features using the latest <a href='https://www.google.com/intl/en_ca/chrome/'>Google Chrome</a>.`;
  }
  console.log(browser);

  d.innerHTML = html;

  target.insertBefore(d, target.firstElementChild);
}

let has2DOffscreenCanvas = true;
try {
  (new OffscreenCanvas(0, 0)).getContext("2d");
} catch (e) {
  has2DOffscreenCanvas = false;
}

if (!has2DOffscreenCanvas) {
  polyfilled.add("OffscreenCanvas");

  class OffscreenCanvas {
    constructor(width, height) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;

      this.canvas.convertToBlob = () => {
        return new Promise((resolve) => {
          this.canvas.toBlob(resolve);
        });
      };

      return this.canvas;
    }
  }
  globalThis.OffscreenCanvas = OffscreenCanvas;
}

const hasCanvasFilter = !!globalThis.CanvasFilter;

if (!hasCanvasFilter) {
  polyfilled.add("CanvasFilter");

  class CanvasFilter {
    constructor(desc) {
      if (!Array.isArray(desc)) {
        desc = [desc];
      }
      this.desc = desc;
    }

    gaussianBlur(ctx, f) {
      if (ctx._filter) {
        ctx._filter(`blur(${f.stdDeviation}px)`);
        ctx._drawImage(ctx.canvas, 0, 0);
        ctx._filter("none");
      } else {
        boxBlurCanvasRGBA(
          ctx,
          0,
          0,
          ctx.canvas.width,
          ctx.canvas.height,
          f.stdDeviation,
          2,
        );
      }
    }

    colorMatrix(ctx, f) {
      const id = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      const pixels = id.data;
      const m = f.values;

      const out = ctx.createImageData(id);

      for (let i = 0; i < pixels.length; i += 4) {
        const p = [
          pixels[i] / 255,
          pixels[i + 1] / 255,
          pixels[i + 2] / 255,
          pixels[i + 3] / 255,
        ];

        const r = m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3] * p[3] + m[4];
        const g = m[5] * p[0] + m[6] * p[1] + m[7] * p[2] + m[8] * p[3] + m[9];
        const b = m[10] * p[0] + m[11] * p[1] + m[12] * p[2] + m[13] * p[3] +
          m[14];
        const a = m[15] * p[0] + m[16] * p[1] + m[17] * p[2] + m[18] * p[3] +
          m[19];

        out.data[i] = r * 255;
        out.data[i + 1] = g * 255;
        out.data[i + 2] = b * 255;
        out.data[i + 3] = a * 255;
      }

      ctx.putImageData(out, 0, 0);
    }

    apply(ctx) {
      for (const f of this.desc) {
        try {
          this[f.filter](ctx, f);
        } catch (e) {
          console.error("Unkown filter:", f.filter);
        }
      }
    }
  }

  window.CanvasFilter = CanvasFilter;
}

function injectFilter(context) {
  const fs = context.__lookupSetter__("filter");
  if (fs) {
    context._filter = fs;
  }

  Object.defineProperty(context, "filter", { value: null, writable: true });

  let size = [-1, -1];
  let tmp = null;
  let tctx = null;

  for (
    const op of [
      "drawImage",
      "fillRect",
      "fill",
      "stroke",
      "strokeRect",
      "fillText",
      "strokeText",
    ]
  ) {
    const orig = context[`_${op}`] = context[op];
    context[op] = function (...args) {
      if (this.filter === null) {
        return orig.bind(this)(...args);
      }

      if (size[0] != this.canvas.width || size[1] != this.canvas.height) {
        size[0] = this.canvas.width;
        size[1] = this.canvas.height;
        tmp = new OffscreenCanvas(...size);
        tctx = tmp.getContext("2d");
      }

      tctx.reset();
      tctx._drawImage(this.canvas, 0, 0);

      this.clearRect(0, 0, this.canvas.width, this.canvas.height);

      orig.bind(this)(...args);

      if (this.filter instanceof CanvasFilter) {
        this.filter.apply(this);
      }

      tctx._drawImage(this.canvas, 0, 0);

      this.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this._drawImage(tmp, 0, 0);
    };
  }
}

function applyNewAPI(canvas, context) {
  const ctx = context.prototype;

  if (!ctx.hasOwnProperty("reset")) {
    polyfilled.add("reset");
    ctx.reset = function () {
      this.canvas.width = this.canvas.width;
    };
  }

  if (!ctx.hasOwnProperty("roundRect")) {
    polyfilled.add("roundRect");
    ctx.roundRect = function (x, y, width, height, radii) {
      if (!Array.isArray(radii)) {
        radii = [radii];
      }
      if (radii.length == 1) {
        radii.push(radii[0]);
      }
      if (radii.length == 2) {
        radii.push(radii[0]);
        radii.push(radii[1]);
      }

      this.moveTo(x + radii[0], y);
      this.lineTo(x + width - radii[1], y);
      this.arcTo(x + width, y, x + width, y + radii[1], radii[1]);
      this.lineTo(x + width, y + height - radii[2]);
      this.arcTo(
        x + width,
        y + height,
        x + width - radii[2],
        y + height,
        radii[2],
      );
      this.lineTo(x + radii[3], y + height);
      this.arcTo(x, y + height, x, y + height - radii[3], radii[3]);
      this.lineTo(x, y + radii[0]);
      this.arcTo(x, y, x + radii[0], y, radii[0]);
    };
  }

  if (!ctx.hasOwnProperty("filter") || !hasCanvasFilter) {
    polyfilled.add("filter");
    injectFilter(ctx);
  }
}

applyNewAPI(HTMLCanvasElement, CanvasRenderingContext2D);

if (has2DOffscreenCanvas) {
  applyNewAPI(OffscreenCanvas, OffscreenCanvasRenderingContext2D);
}
