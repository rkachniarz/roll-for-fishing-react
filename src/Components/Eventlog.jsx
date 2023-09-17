import { Container } from './Container';

export function EventLog({ children }) {
  let output = children.map(child => <div>{child}</div>);
  return <Container cname="EventLog">{output}</Container>;
}

