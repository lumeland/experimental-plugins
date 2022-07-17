export const layout = "layout.jsx";
export const title = "This is the title";

import { testObject } from "./object.jsx";
import { testString } from "./string.jsx";

// Export a function
export default ({ title }, { url }) => (
  <>
    <h1>{title}</h1>
    <p>
      This is a JSX page rendered with Preact <a href={url("/")}>Go to home</a>
    </p>
    <p>{testObject.test}</p>
    <p>{testString}</p>
  </>
);
