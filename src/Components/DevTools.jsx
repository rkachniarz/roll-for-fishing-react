import clsx from "clsx";
import Modal from "./Modal";
import Button from "./Button";
import { useState } from "react";
import Container from "./Container";
import { Displayable } from "../Functions/displayable";

const displayTest = new Displayable();


export default function DevTools(player){
let [modalOpen, setModalOpen] = useState(false)

const displayThing =
    <Container cname="DisplayableItem">
        <img className='Icon' src={displayTest.icon} alt={displayTest.infotext} onClick={displayTest.onClickFunction}></img>
    </Container>;

const modalContent = 
<Container cname="App-main">
    <Container>
        <p>Siema</p>
        <Button cname="Button-small" callback={toggleModal}>Nara</Button>
    </Container>
    <Container cname="Inventory-outer CenterFlex">
        <Container cname="Inventory-inner">{displayThing}{displayThing}{displayThing}{displayThing}{displayThing}{displayThing}{displayThing}</Container>
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