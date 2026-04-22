import { getRandomNumber, pickFromArray, roll20, pickRandom, mergeArrays } from './helpers.js';

const sizes = [
  { name: 'Tiny', chance: 5, difficultyMod: 0 },
  { name: 'Small', chance: 20, difficultyMod: 1 },
  { name: '', chance: 0, difficultyMod: 2 },
  { name: 'Large', chance: 20, difficultyMod: 3 },
  { name: 'Gigantic', chance: 15, difficultyMod: 4 },
  { name: 'Humongous', chance: 5, difficultyMod: 5 },
];

export class Fish {
  constructor(location, spot, mods) {
    const { fishVantage, fishDifficultyMod, fishXPmod, fishSizeIndexMod } = mods;

    const { name, difficultyMod, size, subnames } = pickRandom(mergeArrays(location.fish, spot.fish));
    const pickedSubname = pickFromArray(subnames);
    this.name = `${pickedSubname} ${name}`;
    const pickedSize = pickRandom(sizes);
    const sizeIndex = Math.min(Math.max(sizes.indexOf(pickedSize) + fishSizeIndexMod, 0), sizes.length - 1);
    const segmentWidth = (size[1] - size[0]) / sizes.length;
    const bandMin = size[0] + sizeIndex * segmentWidth;
    const bandMax = size[0] + (sizeIndex + 1) * segmentWidth;
    this.numericSize = getRandomNumber(Math.round(bandMin * 10), Math.round(bandMax * 10)) / 10;
    this.size = sizes[sizeIndex].name;
    this.difficulty = difficultyMod + fishDifficultyMod + pickedSize.difficultyMod;
    this.xp = Math.max(this.difficulty + fishXPmod, 0);
    this.requiredRoll = this.difficulty + roll20(fishVantage);
    this.timesEncountered = 0;
  }

  provideDescription() {
    return `${this.size} ${this.name}`;
  }
}
