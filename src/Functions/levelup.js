import { pickRandom } from "./helpers.js";

const treasures = [{name: "A very round stone", chance: 0}]

export function increasePlayerFishingSkill(player, increase=1) {
    player.skill += increase;
}

export function giveRandomSpecialTreasure(player) {
    player.inventory.pop(pickRandom(treasures))
}