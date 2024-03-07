export default ({ children, title }) => (
  <html>
    <head>
      <title>{title}</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
      <nav>
        <header>
          <p>Layout: layout.jsx</p>
        </header>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/hono_jsx_page_example">Hono JSX Page Example</a>
          </li>
          <li>
            <a href="/vento_page_example">Vento Page Example</a>
          </li>
        </ul>
      </nav>
      <main>
        {children}
      </main>
    </body>
  </html>
);
