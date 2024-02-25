// this.uid = uid;
// this.name = name;
// this.icon = icon;
// this.description = description;
// this.flavor = flavor;
// this.active = active;
// this.itemMechanics = mechanics

import clsx from "clsx";
import { mergeArrays, unmergeArray } from "./../Functions/helpers.js";
import { useState } from "react";

export default function Item({ item, mods, setMods, setItemTooltip }) {

  let classes = clsx("DisplayableItem", { "Item-active": item.active, "Item-inactive": !item.active })

  function handleHovered(hovered) {
    setItemTooltip(hovered ? item : {});
  }

  function activate() {
    let newMods = mods;
    Object.keys(item.mechanics).forEach((key) => {
      if (typeof newMods[key] === 'object') newMods[key] = mergeArrays(mods[key], item.mechanics[key]);
      else newMods[key] = mods[key] + item.mechanics[key];
    });
    setMods(newMods);
    item.active = true;
  }

  function deactivate() {
    let newMods = mods;
    Object.keys(item.mechanics).forEach((key) => {
      if (typeof newMods[key] === 'object') newMods[key] = unmergeArray(mods[key], item.mechanics[key]);
      else newMods[key] = mods[key] - item.mechanics[key];
    });
    setMods(newMods);
    item.active = false;
  }

  function toggleItem() {
    if (item.active)
      {
        deactivate();
      }
    else
    {
      activate();
    }
  }

  return (
    <div
      className={classes}
      onMouseEnter={() => handleHovered(true)}
      onMouseLeave={() => handleHovered(false)}
    >
      <p style={{ display: "inline" }} onClick={toggleItem}>{item.icon}</p>
    </div>
  )
}
