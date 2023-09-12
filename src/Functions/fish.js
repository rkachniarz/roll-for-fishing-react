import { getRandomNumber, roll20, pickRandom } from "./helpers.js";

const sizes = [
    {name: "Tiny",
     chance: 5},
    {name: "Small",
      chance: 20},
    {name: "",
     chance: 0},
    {name: "Large",
     chance: 20},
    {name: "Gigantic",
     chance: 15},
    {name: "Humongous",
     chance: 5}]

export class Fish {
    constructor(location){

        const {name, difficultyMod, subnames } = pickRandom(location);
        const pickedSubname = subnames[getRandomNumber(0, subnames.length-1)]
        this.name = `${pickedSubname} ${name}`;
        const pickedSize = pickRandom(sizes);
        this.size = pickedSize.name;
        this.difficulty = (difficultyMod + (sizes.indexOf(pickedSize)));
        this.xp = (Math.max(this.difficulty, 0))
        this.requiredRoll = (this.difficulty + roll20());
    }

    provideDescription() {
        return `${this.size} ${this.name}`
    }
}