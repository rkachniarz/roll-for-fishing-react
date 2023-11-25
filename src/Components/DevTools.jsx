import clsx from "clsx";
import Modal from "./Modal";
import Button from "./Button";
import { useState } from "react";
import Container from "./Container";
import Item from "./Item";

let testItem = {
  uid: 5,
  name: 'Four-leaf underwater clover',
  icon: '🍀',
  description: 'Advantage on fishing rolls. +3 fish difficulty.',
  flavor: 'You are so lucky, you only find the GOOD fish.',
  mechanics: { playerSkillMod: 10 },
  active: false
}



export default function DevTools({ location, mods, setMods }) {
  let [modalOpen, setModalOpen] = useState(false)
  console.log('mods', mods)

  const modalContent =
    <Container cname="App-main">
      <Container>
        <p>Siema</p>
        <Button cname="Button-small" callback={toggleModal}>Nara</Button>
      </Container>
      <Container cname="Inventory-outer CenterFlex">
        <Container cname="Inventory-inner">
          <Item item={testItem} mods={mods} setMods={setMods}></Item>
        </Container>
      </Container>
    </Container>;

  function toggleModal() {
    setModalOpen(!modalOpen);
  }


  return (
    <div>
      <button onClick={toggleModal}>Open Debug Modal</button>
      <Modal cname="Debug" active={modalOpen}>
        {modalContent}
      </Modal>
    </div>
  )
}
