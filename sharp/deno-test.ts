import sharp from "npm:sharp@0.33.0-alpha.9";

const image = await Deno.readFile("./kevin-schmid-unsplash.jpg");
const data = await sharp(image)
  .rotate(90)
  .resize(200)
  .avif()
  .toBuffer();

await Deno.writeFile("./kevin-schmid-unsplash-rotated.avif", data);
