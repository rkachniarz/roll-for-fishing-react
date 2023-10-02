import { defaultIcon } from '../../public/logo192.png';

export class Displayable {
  constructor(icon = defaultIcon, infotext = 'A thing', RMBFunction) {
    (this.icon = icon), (this.infotext = infotext);
    this.RMBFunction = RMBFunction;
  }
}
