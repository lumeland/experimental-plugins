export const layout = "layout.jsx";
export const title = "Hono JSX + Vento Demo";

export default ({ title }: Lume.Data, { html }: Lume.Helpers) => (
  <>
    {html`<h1>${title}</h1>`}
    <p>Small demo of mixing Hono, JSX and Vento in Lume.</p>
    <p>Click the links to the left for examples</p>
  </>
);
