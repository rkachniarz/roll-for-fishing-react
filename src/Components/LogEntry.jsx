export function LogEntry({ cname, keyname, children }) {
  return <div key={keyname} className={`log-${cname}`}>{children}</div>;
}
