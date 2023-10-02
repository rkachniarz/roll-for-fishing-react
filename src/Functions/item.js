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

    activate(modState) {
      this.itemMechanics.keys.forEach((element,index) => {
             // if (typeof(element) === "number")
              {modState.element += itemMechanics.element}
                            //else if (typeof(element) === "string"){modState[element]}
    })   
    }
    deactivate(modState) {}

  }
//         
//array.forEach((element,index)=>{carray[index]=element+barray[index]})
//     }

//     // playerAdvantage: false,
//     // playerDisadvantage: false,
//     // playerSkillMod: 0,
//     // playerFishFindMod: 0,
//     // playerTreasureFindMod: 0,
//     // fishAdvantage: false,
//     // fishDisadvantage: false,
//     // fishDifficultyMod: 0,
//     // fishSizeModArray: [],
//     // extraMainButtonCallbacks: []
