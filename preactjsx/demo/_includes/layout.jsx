export default ({ children, title }) => (
  <html>
    <head>
      <title>{title}</title>
    </head>
    <body>
      <main>
        {children}

        Hello world
      </main>
    </body>
  </html>
);
