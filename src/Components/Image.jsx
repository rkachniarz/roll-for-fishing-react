export function Image({ cname, source = '%PUBLIC_URL%/default.jpg' }) {
  return <img className={cname} src={source} />;
}
