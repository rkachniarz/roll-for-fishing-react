import Modal from './Modal';
import Button from './Button';
import { useState } from 'react';
import Container from './Container';

export default function DevTools({ location, player }) {
  let [modalOpen, setModalOpen] = useState(false);
  let [addedUids, setAddedUids] = useState(() => new Set(player.inventory.items.map((i) => i.uid)));

  function addToInventory(item) {
    player.inventory.items.push({ ...item, active: false });
    setAddedUids((prev) => new Set(prev).add(item.uid));
  }

  function toggleModal() {
    setModalOpen(!modalOpen);
  }

  return (
    <div>
      <button onClick={toggleModal}>Open Debug Modal</button>
      <Modal cname="Debug" active={modalOpen}>
        <Container cname="App-main">
          <Container>
            <p>Debug Tools</p>
            <Button cname="Button-small" callback={toggleModal}>
              Close
            </Button>
          </Container>
          <Container>
            <p>
              <strong>Location treasure</strong>
            </p>
            {location.treasure.map((item) => (
              <div key={item.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                <span>
                  {item.icon} {item.name}
                </span>
                <Button cname="Button-small" disabled={addedUids.has(item.uid)} callback={() => addToInventory(item)}>
                  Add to inventory
                </Button>
              </div>
            ))}
          </Container>
        </Container>
      </Modal>
    </div>
  );
}
