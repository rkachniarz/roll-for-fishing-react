import { getRandomNumber, pickFromArray } from './helpers.js';

const xpToLevel = [0, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];

export function generateName() {
  const prefixes = [
    'Woj',
    'Bio',
    'Gaz',
    'Dur',
    'Mat',
    'Kek',
    'Far',
    'Arb',
    'Yarr',
    'Kli',
    'Tur',
    'Hel',
    'Fir',
    'Chrum',
    'Pika',
    'Roz',
    'Xtan',
  ];
  const suffixes = [
    'ek',
    'ak',
    'son',
    'dig',
    'dib',
    'ent',
    'gun',
    'bip',
    'blop',
    'pip',
    'murgl',
    'ma',
    'uss',
    'huk',
    'gle',
    'wald',
    'ena',
    'ata',
    'iza',
    'dottir',
    'ola',
    'ula',
    'dong',
  ];

  return pickFromArray(prefixes) + pickFromArray(suffixes);
}

export const classes = [
  {
    id: 0,
    name: 'Fish Fighter',
    skillMin: 2,
    skillMax: 7,
    treasureFindMin: 0,
    treasureFindMax: 5,
    fishFindMin: 1,
    fishFindMax: 5,
  },
  {
    id: 1,
    name: 'Fishing Wizard',
    skillMin: 1,
    skillMax: 5,
    treasureFindMin: 1,
    treasureFindMax: 5,
    fishFindMin: 5,
    fishFindMax: 10,
  },
  {
    id: 2,
    name: 'Rogue Fisherman',
    skillMin: 0,
    skillMax: 5,
    treasureFindMin: 5,
    treasureFindMax: 10,
    fishFindMin: 0,
    fishFindMax: 5,
  },
];

export class Player {
  constructor(name = 'Player', classId = 0) {
    this.name = name;
    this.class = classes[classId];
    this.skill = getRandomNumber(this.class.skillMin, this.class.skillMax);
    this.treasureFind = getRandomNumber(this.class.treasureFindMin, this.class.treasureFindMax);
    this.fishFind = getRandomNumber(this.class.fishFindMin, this.class.fishFindMax);
    this.totalxp = 0;
    this.level = 0;
    this.fishHistory = [];
    this.inventory = [];
    // {
    //   fishBucket: [],
    //   junk: [],
    //   common: [],
    //   uncommon: [],
    // }
    this.junkPile = [];
  }

  create({ name, playerClass, skill, treasureFind, fishFind }) {
    this.name = name;
    this.class = classes[playerClass];
    this.skill = skill;
    this.treasureFind = treasureFind;
    this.fishFind = fishFind;
  }

  gainXP(gain) {
    this.totalxp += gain;
    if (this.level === xpToLevel.length) return false;
    if (this.totalxp > xpToLevel[this.level + 1]) {
      this.level += 1;
      return true;
    } else return false;
  }

  restore({ name, playerClass, skill, treasureFind, fishFind, totalxp, level, inventory }) {
    this.name = name;
    this.class = playerClass;
    this.skill = skill;
    this.treasureFind = treasureFind;
    this.fishFind = fishFind;
    this.totalxp = totalxp;
    this.level = level;
    this.inventory = inventory;
  }
}
