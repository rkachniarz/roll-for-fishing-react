import Button from "./Button";
import Container from "./Container";


export default function LoadPlayer({ modalOpen }) {

  function handleButtonClick() {
    modalOpen(false);
  }
  return (
    <Container>
      <p>This component will allow loading different player states from Local Storage</p>
      <Button cname="Button-big" callback={handleButtonClick}>Okay...</Button>
    </Container>
  )
}
