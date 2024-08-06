export default function (): Lume.Plugin {
  return (site: Lume.Site) => {
    site.parseFilename((filename, data): string => {
      const match = filename.match(/(\d+)\.(.+)/);
      if (match) {
        const [, order, basename] = match;
        data.order = parseInt(order);
        return basename;
      } else {
        data.order = 0;
        return filename;
      }
    });
  };
}
