export default ({ children, path, language }) => {
  const cls = `language-${language}`;
  const codeStr = Deno.readTextFileSync(path);

  return (
    <div class="src-display">
      <header>{path}</header>
      <pre>
        <code class={cls}>
          {codeStr}
        </code>
      </pre>
      {children}
    </div>
  );
};
