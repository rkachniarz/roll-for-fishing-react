import { getRandomNumber, roll20 } from "./helpers.js";

const xpToLevel = [0, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000];

const classes = [{
    name: 'Fish Fighter',
    skillmin: 2,
    skillmax: 7,
    treasureFindMin: 0,
    treasureFindMax: 5,
    fishFindMin: 1,
    fishFindMax: 5
}, 
{
    name: 'Fishing Wizard',
    skillmin: 1,
    skillmax: 5,
    treasureFindMin: 1,
    treasureFindMax: 5,
    fishFindMin: 5,
    fishFindMax: 10
},
{
    name: 'Rogue Fisherman',
    skillmin: 0,
    skillmax: 5,
    treasureFindMin: 5,
    treasureFindMax: 10,
    fishFindMin: 0,
    fishFindMax: 5
}]

export class Player {
    constructor(name="Player", classId=0){
        this.name = name; 
        this.class = classes[classId];
        this.skill = getRandomNumber(this.class.skillmin, this.class.skillmax);
        this.treasureFind = getRandomNumber(this.class.treasureFindMin, this.class.treasureFindMax);
        this.fishFind = getRandomNumber(this.class.fishFindMin, this.class.fishFindMax);
        this.totalxp = 0;
        this.level = 0;
        this.fishHistory = [];
        this.inventory = [];
    }


    gainXP(gain) {
        this.totalxp += gain;
        if (this.level === xpToLevel.length) return false; 
        if (this.totalxp >= xpToLevel[this.level+1]) {
            this.level +=1;
            return true;
        } else return false;
    }

    restore(name, playerClass, skill, treasureFind, fishFind, totalxp, level, inventory) {
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