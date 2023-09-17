import { Container } from './Container';
import { LogEntry } from './LogEntry';

export function EventLog({ children }) {
  let output = children.map((child,index) => <LogEntry key={`logentry-${index}`} cname="fishing-log">{child}</LogEntry>);
  return <Container cname="EventLog">{output}</Container>;
}

