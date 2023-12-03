export default function Image({ cname, source = 'default.jpg' }) {
  return <img className={cname} src={source} />;
}
