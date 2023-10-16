import defaultIcon from '../Data/Assets/defaultImage.png';

function defaultOnClickFunction(){
  alert('This object has no onClick function defined');
}

export class Displayable {
  constructor(icon = defaultIcon, description = 'A thing', flavor = '', onClickFunction=defaultOnClickFunction) {
    this.icon = icon;
    this.description = description;
    this.flavor = flavor;
    this.onClickFunction = onClickFunction;
  }
}

export class Item extends Displayable {
  constructor({uid, name, icon, description, flavor, active, itemMechanics}){
    super(icon, description, flavor);
    this.onClickFunction = this.toggleActive;
    this.uid = uid;
    this.name = name;
    this.active = active; //bool
    this.itemMechanics = itemMechanics;
  }

  toggleActive(modState){
    if (this.active)
      this.deactivate(modState);
    else
      this.activate(modState);

    this.active = !this.active;
  }

  activate(modState){console.log("Item activated")}
  deactivate(modState){console.log("Item deactivated")}

}
