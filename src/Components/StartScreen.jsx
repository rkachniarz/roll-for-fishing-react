import { useState } from "react"
import Container from "./Container";
import Button from "./Button";
import Modal from "./Modal";
import { getRandomNumber } from "../Functions/helpers";
import PlayerCreator from "./PlayerCreator";
import { generateName, Player } from "../Functions/player";
import LoadPlayer from "./LoadPlayer";


export default function StartScreen({ currentPlayer, setCurrentPlayer }) {

  let [modalOpen, setModalOpen] = useState(false);
  let [modalContent, setModalContent] = useState('');

  function openPlayerCreator() {
    setModalContent(<PlayerCreator playerValue={currentPlayer} setCurrentPlayer={setCurrentPlayer} />)
    setModalOpen(!modalOpen);
  }

  function createRandomPlayer() {
    setCurrentPlayer(new Player(generateName(), getRandomNumber(0, 2)));
  }

  function loadPlayer() {
    setModalContent(<LoadPlayer modalOpen={setModalOpen} />);
    setModalOpen(!modalOpen);
  }

  return (
    <Container cname="App-main">
      <div>
        <Button cname="Button-big" callback={openPlayerCreator}>Create character</Button>
      </div>
      <div>
        <Button cname="Button-big" callback={createRandomPlayer}>Random character</Button>
      </div>
      <div>
        <Button cname="Button-big" callback={loadPlayer}>Load character</Button>
      </div>
      <Modal active={modalOpen}>
        {modalContent}
      </Modal>
    </Container>
  )
}
