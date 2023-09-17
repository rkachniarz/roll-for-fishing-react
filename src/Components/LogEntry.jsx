export function LogEntry({ cname, key, children }) {
  return <div key={key} className={`log-${cname}`}>{children}</div>;
}
