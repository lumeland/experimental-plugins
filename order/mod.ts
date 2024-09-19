export default function (): Lume.Plugin {
  return (site: Lume.Site) => {
    site.parseBasename((name) => {
      const match = name.match(/(\d+)\.(.+)/);
      if (match) {
        const [, order, basename] = match;
        return {
          order: parseInt(order),
          basename,
        };
      }
    });
  };
}
