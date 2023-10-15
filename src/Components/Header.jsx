import Container from './Container';
import Image from './Image';

export default function Header({ player }) {
  let classSmall = player ? '-small' : '';

  return (
    <Container cname={`App-header${classSmall}`}>
      <div className={`App-logo${classSmall}`}>🎲🐟</div>
      <h3>Roll for fishing!</h3>
    </Container>
  );
}
