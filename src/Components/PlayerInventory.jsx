import { useState } from 'react';
import Item from './Item';
import Modal from './Modal';
import Button from './Button';

function stackByUid(arr) {
  const map = new Map();
  for (const entry of arr) {
    if (map.has(entry.uid)) map.get(entry.uid).count++;
    else map.set(entry.uid, { ...entry, count: 1 });
  }
  return [...map.values()];
}

function stackByName(arr) {
  const map = new Map();
  for (const entry of arr) {
    if (map.has(entry.name)) map.get(entry.name).count++;
    else map.set(entry.name, { ...entry, count: 1 });
  }
  return [...map.values()];
}

function SimpleSlot({ icon, count, tooltipItem, setItemTooltip }) {
  function handleMouseMove(e) {
    setItemTooltip({ item: tooltipItem, x: e.clientX + 14, y: e.clientY + 14 });
  }
  function handleMouseLeave() {
    setItemTooltip({});
  }
  return (
    <div className="DisplayableItem" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <span style={{ fontSize: '20px', lineHeight: '32px' }}>{icon}</span>
      {count > 1 && <span className="InventorySlot-count">{count}</span>}
    </div>
  );
}

export default function PlayerInventory({ inventory, active, onClose, mods, setMods, setItemTooltip }) {
  const [activeTab, setActiveTab] = useState('items');

  const stackedItems = stackByUid(inventory.items);
  const stackedFish = stackByName(inventory.fishBucket);
  const stackedJunk = stackByUid(inventory.junk.filter((j) => j.uid !== 0));

  return (
    <Modal cname="InventoryPanel" active={active}>
      <div className="InventoryPanel-header">
        <span>🎒 Inventory</span>
        <Button cname="Button-small" callback={onClose}>
          Close
        </Button>
      </div>

      <div className="InventoryPanel-tabs">
        <button
          className={`Button-tab${activeTab === 'items' ? ' Button-tab-active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items ({stackedItems.length})
        </button>
        <button
          className={`Button-tab${activeTab === 'fish' ? ' Button-tab-active' : ''}`}
          onClick={() => setActiveTab('fish')}
        >
          Fish ({stackedFish.length})
        </button>
        <button
          className={`Button-tab${activeTab === 'junk' ? ' Button-tab-active' : ''}`}
          onClick={() => setActiveTab('junk')}
        >
          Junk ({stackedJunk.length})
        </button>
      </div>

      <div className="Inventory-inner">
        {activeTab === 'items' &&
          (stackedItems.length === 0 ? (
            <p className="Inventory-empty">No items found yet.</p>
          ) : (
            stackedItems.map((item) => (
              <div key={item.uid} style={{ position: 'relative' }}>
                <Item item={item} mods={mods} setMods={setMods} setItemTooltip={setItemTooltip} />
                {item.count > 1 && <span className="InventorySlot-count">{item.count}</span>}
              </div>
            ))
          ))}
        {activeTab === 'fish' &&
          (stackedFish.length === 0 ? (
            <p className="Inventory-empty">Bucket is empty.</p>
          ) : (
            stackedFish.map((fish) => (
              <SimpleSlot
                key={fish.name}
                icon="🐟"
                count={fish.count}
                tooltipItem={{
                  name: fish.name,
                  description: fish.count > 1 ? `×${fish.count} in bucket` : 'In bucket',
                  flavor: '',
                }}
                setItemTooltip={setItemTooltip}
              />
            ))
          ))}
        {activeTab === 'junk' &&
          (stackedJunk.length === 0 ? (
            <p className="Inventory-empty">No junk collected.</p>
          ) : (
            stackedJunk.map((junk) => (
              <SimpleSlot
                key={junk.uid}
                icon="🗑️"
                count={junk.count}
                tooltipItem={{
                  name: junk.name,
                  description: `Value: ${junk.value} copper${junk.count > 1 ? ` · ×${junk.count}` : ''}`,
                  flavor: junk.flavor ?? '',
                }}
                setItemTooltip={setItemTooltip}
              />
            ))
          ))}
      </div>
    </Modal>
  );
}
