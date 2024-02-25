import Container from "./Container";
import clsx from "clsx";
import { isEmpty } from "../Functions/helpers";
import { useState, useEffect } from "react";

export default function ItemTooltip({ item }) {
  let className = clsx((isEmpty(item)) ? 'ItemTooltip-empty' : 'ItemTooltip');

  let [equipText, setEquipText] = useState('')

  useEffect(()=>{setEquipText(item.active ? 'unequip' : 'equip')})

  return (
    <Container cname={className}>
      <p className="ItemName">{item.name}</p>
      <p className="ItemDescription">{item.description}</p>
      <p className="ItemFlavor">{item.flavor}</p>
      <p>Click to {equipText}</p>
    </Container>
  )
}
