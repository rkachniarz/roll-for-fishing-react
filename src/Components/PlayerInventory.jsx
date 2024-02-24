import Item from "./Item";
import Container from "./Container"


export default function PlayerInventory({ inventory, mods, setMods, setItemTooltip }) {
  if (inventory.length === 0) return;

  const displayedInventory = inventory.map((item) => { return <Item item={item} mods={mods} setMods={setMods} setItemTooltip={setItemTooltip} /> })


  return (
    <Container cname="Inventory-outer CenterFlex">
      <Container cname="Inventory-inner">
        {displayedInventory}
      </Container>
    </Container>
  )


}
