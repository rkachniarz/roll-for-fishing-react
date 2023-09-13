export function LogEntry({ cname, children }) {
  return <span className={`log-${cname}`}>{children}</span>;
}
