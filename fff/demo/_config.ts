import lume from "lume/mod.ts";
import fff from "../mod.ts";

export default lume()
  .use(fff({
    // https://fff.js.org/concepts/flavor-transform.html#arrow
    presets: [{
      created: 'date',
      flags: ({
        flags,
        draft,
        visibility,
      }: {
        flags?: string[]
        draft?: boolean
        visibility?: 'public' | 'unlisted' | 'private'
      }) =>
        Array.from(
          new Set([
            ...(flags ?? []),
            ...(draft ? ['draft'] : []),
            ...(visibility ? [visibility] : []),
          ])
        ),
    }]
  }));
