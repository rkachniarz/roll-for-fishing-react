import clsx from "clsx";
import Modal from "./Modal";
import Button from "./Button";
import { useState } from "react";
import Container from "./Container";
import { Displayable, Item } from "../Functions/displayable";
import defaultImage from "../Data/Assets/Item-default.png"

const displayTest = new Displayable();
const itemTest = new Item({
  icon: defaultImage,
  uid: 0,
  name: 'Test Item',
  description: 'An Item',
  flavor: 'Nice and flavorful',
  active: true,
  itemMechanics: {awesome: true}
})


export default function DevTools(player){
let [modalOpen, setModalOpen] = useState(false)

const displayThing =
    <Container cname="DisplayableItem">
        <img className='Icon' src={displayTest.icon} alt={displayTest.description} onClick={displayTest.onClickFunction}></img>
    </Container>;

const displayItem =
    <Container cname="DisplayableItem">
        <img className='Icon' src={itemTest.icon} alt={itemTest.description} onClick={() => itemTest.onClickFunction({})}></img>
    </Container>;

const modalContent =
<Container cname="App-main">
    <Container>
        <p>Siema</p>
        <Button cname="Button-small" callback={toggleModal}>Nara</Button>
    </Container>
    <Container cname="Inventory-outer CenterFlex">
        <Container cname="Inventory-inner">
          {displayThing}{displayThing}{displayThing}{displayThing}
          {displayItem}{displayItem}{displayItem}{displayItem}
         </Container>
    </Container>
</Container>;

function toggleModal(){
    setModalOpen(!modalOpen);
}


return(
    <div>
        <button onClick={toggleModal}>Open Debug Modal</button>
        <Modal cname="Debug" active={modalOpen}>
            {modalContent}
        </Modal>
    </div>
)
}
