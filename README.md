# Experimental Plugins

A repo to test and experiment with plugins for Lume.

If you are using any of these plugins in your projects, keep in mind that it can
be removed at any time for several reasons:

- It's moved to Lume main repo.
- A new plugin has been created to replace it.
- It's too unstable or not useful

For these reasons, it's high recommended to import from jsDelivr and use the
commit hash as the version
(`https://cdn.jsdelivr.net/gh/lumeland/experimental-plugins@[commit]/[plugin]/mod.ts`)

For example:

```js
// Not recommended
import astralPlugin from "https://raw.githubusercontent.com/lumeland/experimental-plugins/main/astral/mod.ts";

// Recommended
import astralPlugin from "https://cdn.jsdelivr.net/gh/lumeland/experimental-plugins@7c42e88e95917ebaf3510d4cece118d68992ff63/astral/mod.ts";
```

## Contributing

If you use Deno plugins for vscode and you don't enable Deno on user scope. Your
vscode will not able to use the correct `deno.json` file. While it is ok for
building/testing, this can cause a productivity problem (ex. type checking
suggestion). To avoid this, you need to:

1. create `.vscode/setting.json` in the plugin dir, that you plan to work on, by
   cloning `.vsode` from top repo to the plugin dir (copy&paste).
2. Then open the plugin dir in new workspace.

Aside from `/.vscode` in top level repo, the rest `.vscode` are ignored by Git.
