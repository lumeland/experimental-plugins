export default function Image({ src, alt }) {
  return <img src={src || "https://via.placeholder.com/350x150"} alt={alt} />;
}
