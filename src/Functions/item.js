import { joinArrays, unmergeArray } from './helpers';

class Item {
  constructor(uid, name, icon, description, flavor, mechanics, active) {
    this.uid = uid;
    this.name = name;
    this.icon = icon;
    this.description = description;
    this.flavor = flavor;
    this.active = active;
    this.itemMechanics = mechanics;
  }

  activate(item, mods) {
    let newMods = mods;
    Object.keys(item.mechanics).forEach((key) => {
      if (typeof newMods[key] === 'object') newMods[key] = joinArrays(mods[key], item.mechanics[key]);
      else newMods[key] = mods[key] + item.mechanics[key];
    });
    return newMods;
  }

  deactivate(item, mods) {
    let newMods = mods;
    Object.keys(item.mechanics).forEach((key) => {
      if (typeof newMods[key] === 'object') newMods[key] = unmereArray(mods[key], item.mechanics[key]);
      else newMods[key] = mods[key] + item.mechanics[key];
    });
    return newMods;
  }
}
//
//array.forEach((element,index)=>{carray[index]=element+barray[index]})
//     }

// playerAdvantage: false,
// playerDisadvantage: false,
// playerSkillMod: 0,
// playerFishFindMod: 0,
// playerTreasureFindMod: 0,
// fishAdvantage: false,
// fishDisadvantage: false,
// fishDifficultyMod: 0,
// fishSizeModArray: [],
// extraMainButtonCallbacks: []
