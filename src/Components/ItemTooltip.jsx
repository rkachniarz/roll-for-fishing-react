import Container from "./Container";
import clsx from "clsx";
import { isEmpty } from "../Functions/helpers";


export default function ItemTooltip({ item }) {
  let className = clsx((isEmpty(item)) ? 'ItemTooltip-empty' : 'ItemTooltip');

  return (
    <Container cname={className}>
      <p className="ItemName">{item.name}</p>
      <p className="ItemDescription">{item.description}</p>
      <p className="ItemFlavor">{item.flavor}</p>
      <p>Click to {item.active ? 'unequip' : 'equip'}</p>
    </Container>
  )
}
