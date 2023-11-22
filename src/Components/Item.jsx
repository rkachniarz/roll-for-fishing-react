// this.uid = uid;
// this.name = name;
// this.icon = icon;
// this.description = description;
// this.flavor = flavor;
// this.active = active;
// this.itemMechanics = mechanics

import Container from "./Container";

export default function Item ({item, modState}) {

  function toggleItem(){
    //if item is not active, add its mods to modstate and activate it
    //else remove its mods from modstate
  }
  return (
  <Container cname="DisplayableItem">
    <img className='Icon' src={item.icon} alt={item.description} onClick={toggleItem}></img>
  </Container>
  )
}
