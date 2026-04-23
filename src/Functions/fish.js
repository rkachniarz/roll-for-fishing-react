import { getRandomNumber, pickFromArray, roll20, pickRandom, mergeArrays } from './helpers.js';

const sizes = [
  { name: 'Tiny', chance: 5, difficultyMod: 0 },
  { name: 'Small', chance: 20, difficultyMod: 1 },
  { name: '', chance: 0, difficultyMod: 2 },
  { name: 'Large', chance: 20, difficultyMod: 3 },
  { name: 'Gigantic', chance: 15, difficultyMod: 4 },
  { name: 'Humongous', chance: 5, difficultyMod: 5 },
];

// Adjusts the chance of each fish appearing based on current weather conditions.
// Fish can define a weatherChanceMod array with conditions that add a bonus to their base chance.
// Example: { param: 'temperature', min: 9, bonus: 10 } adds +10 chance when temp >= 9.
function applyWeatherMods(fishPool, weather) {
  // If weather data isn't available yet, return the pool unchanged
  if (!weather || weather.temperature === undefined) return fishPool;

  const modded = fishPool.map((fish) => {
    // Fish with no weather preferences or sentinel fish (chance: 0) are unaffected
    if (!fish.weatherChanceMod || fish.chance === 0) return fish;

    // Sum up all bonuses from conditions that are currently met
    const bonus = fish.weatherChanceMod.reduce((sum, cond) => {
      const val = weather[cond.param];
      const meetsMin = cond.min === undefined || val >= cond.min;
      const meetsMax = cond.max === undefined || val <= cond.max;
      return meetsMin && meetsMax ? sum + cond.bonus : sum;
    }, 0);

    return bonus !== 0 ? { ...fish, chance: Math.max(1, fish.chance + bonus) } : fish;
  });

  // Sentinel fish (chance: 0) fills the remainder to 100 in pickRandom.
  // If non-sentinel chances sum to >= 100 after bonuses, scale them down to fit within 99.
  const total = modded.reduce((sum, f) => sum + f.chance, 0);
  if (total < 100) return modded;

  const scale = 99 / total;
  return modded.map((fish) =>
    fish.chance === 0 ? fish : { ...fish, chance: Math.max(1, Math.floor(fish.chance * scale)) },
  );
}

export class Fish {
  constructor(location, spot, mods, weather) {
    const { fishVantage, fishDifficultyMod, fishXPmod, fishSizeIndexMod } = mods;

    const fishPool = applyWeatherMods(mergeArrays(location.fish, spot.fish), weather);
    const { name, difficultyMod, size, subnames } = pickRandom(fishPool);
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
