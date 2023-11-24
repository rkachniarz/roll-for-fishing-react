// this.uid = uid;
// this.name = name;
// this.icon = icon;
// this.description = description;
// this.flavor = flavor;
// this.active = active;
// this.itemMechanics = mechanics

import Container from "./Container";

export default function Item({ item, mods, setMods }) {

  const [displayTooltip, setDisplayTooltip] = useState(false);
  const [hovered, setHovered] = useState(false);

  function handleHovered(hovered) {
    setDisplayTooltip(hovered)
  }

  function activate() {
    let newMods = mods;
    Object.keys(item.mechanics).forEach((key) => {
      if (typeof newMods[key] === 'object') newMods[key] = joinArrays(mods[key], item.mechanics[key]);
      else newMods[key] = mods[key] + item.mechanics[key];
    });
    setMods(newMods);
  }

  function deactivate() {
    let newMods = mods;
    Object.keys(item.mechanics).forEach((key) => {
      if (typeof newMods[key] === 'object') newMods[key] = unmereArray(mods[key], item.mechanics[key]);
      else newMods[key] = mods[key] + item.mechanics[key];
    });
    setMods(newMods);
  }

  function toggleItem() {
    if (item.active) deactivate();
    else activate();
  }

  return (
    <Container
      cname="DisplayableItem"
      onClick={toggleItem}
      onMouseEnter={() => handleHovered(true)}
      onMouseLeave={() => handleHovered(false)}
    >
      {item.icon}
    </Container>
  )
}
