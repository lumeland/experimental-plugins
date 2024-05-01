import SmallTestComponent from "./_components/SmallTestComponent.jsx";

export const layout = "layout.vto";
export const title = "Hono JSX Page + Component Example";

export default ({ title }) => (
  <>
    <h1>{title}</h1>
    <p>This page is written in JSX and rendered with Hono.</p>
    <p>
      It contains some HTML, along with a JSX component displaying the source
      code for this page.
    </p>
    <p>
      It uses the Vento layout defined in <strong>_includes/layout.vto</strong>
    </p>

    <SmallTestComponent
      language="javascript"
      path="hono_jsx_page_example.jsx"
    />
  </>
);
