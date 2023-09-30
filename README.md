# Experimental Plugins

A repo to test and experiment with plugins for Lume

## Contributing

If you use Deno plugins for vscode and you don't enable Deno on user scope. Your
vscode will not able to use the correct `deno.json` file. While it is ok for
building/testing, this can cause a productivity problem (ex. type checking
suggestion). To avoid this, you need to:

1. create `.vscode/setting.json` in the plugin dir, that you plan to work on, by
   cloning `.vsode` from top repo to the plugin dir (copy&paste).
2. Then open the plugin dir in new workspace.

Aside from `/.vscode` in top level repo, the rest `.vscode` are ignored by Git.
