export default function ImagemProduto({ src, alt, ...props }) {
  return <img {...props} src={src || '/LogoEscrthinny.jpg'} alt={alt} onError={event => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = '/LogoEscrthinny.jpg';
  }} />;
}
