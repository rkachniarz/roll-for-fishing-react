import { Fish } from './fish.js';
import { roll20 } from './helpers.js';
//import { increasePlayerFishingSkill, giveRandomSpecialTreasure } from './levelup.js';

function rollForFishing(player) {
  const dieRoll = roll20();
  const rollTotal = dieRoll + player.skill;
  const text =
    dieRoll === 20
      ? `It's a natural 20! With a total of ${rollTotal}`
      : `${dieRoll} + ${player.skill} for a total of ${rollTotal}`;

  return {
    text: text,
    rollTotal: rollTotal,
    isNat20: dieRoll === 20,
  };
}

export function playGame(location, player) {
  const fish = new Fish(location);
  const { text, rollTotal, isNat20 } = rollForFishing(player);
  let catchMessage, playerRollMessage, rollMessage;

  if (rollTotal >= fish.requiredRoll || isNat20) {
    catchMessage = `Congratulations, you've caught it! You've earned ${fish.xp}xp`;
    player.gainXP(fish.xp);
    player.fishHistory.push({ fish, rollTotal });
  } else catchMessage = 'It got away!';

  rollMessage = `You've encountered a ${fish.provideDescription()} - it required a roll of ${
    fish.requiredRoll
  } to catch.`;
  playerRollMessage = `Your roll:  ${text}`;
  return [player, [rollMessage, playerRollMessage, catchMessage]];
}
