import { getRandomNumber, roll20, pickRandom } from './helpers.js';

const sizes = [
  { name: 'Tiny', chance: 5, difficultyMod: 0 },
  { name: 'Small', chance: 20, difficultyMod: 1 },
  { name: '', chance: 0, difficultyMod: 2 },
  { name: 'Large', chance: 20, difficultyMod: 3 },
  { name: 'Gigantic', chance: 15, difficultyMod: 4 },
  { name: 'Humongous', chance: 5, difficultyMod: 5 },
];

export class Fish {
  constructor(location, mods) {
    const { fishAdvantage, fishDisadvantage, fishDifficultyMod, fishXPmod, fishSizeModArray } = mods;

    const { name, difficultyMod, subnames } = pickRandom(location.fish);
    const pickedSubname = subnames[getRandomNumber(0, subnames.length - 1)];
    this.name = `${pickedSubname} ${name}`;
    const pickedSize = pickRandom(sizes.concat(fishSizeModArray));
    this.size = pickedSize.name;
    this.difficulty = difficultyMod + fishDifficultyMod + pickedSize.difficultyMod;
    this.xp = Math.max((this.difficulty + fishXPmod), 0);
    this.requiredRoll = this.difficulty + roll20(fishAdvantage, fishDisadvantage);
    this.timesEncountered = 0;
  }

  provideDescription() {
    return `${this.size} ${this.name}`;
  }
}
