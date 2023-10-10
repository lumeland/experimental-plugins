import sharp from "npm:sharp@0.33.0-alpha.7";

const image = await Deno.readFile("./kevin-schmid-unsplash.jpg");
const data = await sharp(image)
  .rotate()
  .resize(200)
  .avif()
  .toBuffer()

await Deno.writeFile("./kevin-schmid-unsplash-rotated.avif", data);
