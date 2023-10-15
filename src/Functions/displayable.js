import defaultIcon from '../Data/Assets/logo192.png';

function defaultOnClickFunction(){
  alert('This object has no onClick function defined');
} 

export class Displayable {
  constructor(icon = defaultIcon, infotext = 'A thing', onClickFunction=defaultOnClickFunction) {
    this.icon = icon;
    this.infotext = infotext;
    this.onClickFunction = onClickFunction;
  }
}
