import Container from "./Container";


export default function ItemTooltip({item}){
  if (item.keys.length === 0) return;

  return (
    <Container cname="ItemTooltip">
      <p className="ItemName">{item.name}</p>
      <p className="ItemDescription">{item.description}</p>
      <p className="ItemFlavor">{item.flavor}</p>
      <p>Click to {item.active ? 'unequip' : 'equip'}</p>
    </Container>
  )
}
