import { Fish } from './fish.js';
import { roll20 } from './helpers.js';

function rollForFishing(
  player,
  [playerAdvantage, playerDisadvantage, playerSkillMod, playerFishFindMod, playerTreasureFindMod],
) {
  const skillTotal = player.skill + playerSkillMod;
  const fishFindTotal = player.fishFind + playerFishFindMod;
  const treasureFindTotal = player.treasureFind + playerTreasureFindMod;
  const dieRoll = roll20(playerAdvantage, playerDisadvantage);
  const rollTotal = dieRoll + skillTotal;

  const text =
    dieRoll === 20
      ? `It's a natural 20! With a total of ${rollTotal}`
      : `${dieRoll} + ${skillTotal} for a total of ${rollTotal}`;

  return {
    text: text,
    rollTotal: rollTotal,
    isNat20: dieRoll === 20,
  };
}

export function playGame(location, player, modState) {
  const {
    playerAdvantage,
    playerDisadvantage,
    playerSkillMod,
    playerFishFindMod,
    playerTreasureFindMod,
    fishAdvantage,
    fishDisadvantage,
    fishDifficultyMod,
    fishSizeModArray,
    extraMainButtonCallbacks,
  } = modState;

  const fish = new Fish(location, [fishAdvantage, fishDisadvantage, fishDifficultyMod, fishSizeModArray]);
  const { text, rollTotal, isNat20 } = rollForFishing(player, [
    playerAdvantage,
    playerDisadvantage,
    playerSkillMod,
    playerFishFindMod,
    playerTreasureFindMod,
  ]);
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
