import { useState } from "react";
import { roll20, roll100, pickRandom, pickFromArray, removeElement } from "../Functions/helpers";
import { Fish } from "../Functions/fish";
import Button from "./Button";

export default function PlayGameButton({ location, player, mods, setLogs }) {

  let [buttonText, setButtonText] = useState('Roll!');
  let [eventTrigger, setEventTrigger] = useState(0);
  let [fishPool, setFishPool] = useState([]);
  let [treasurePool, setTreasurePool] = useState(location.treasure);



  let logsContent = [];

  function addLogs(message) {
    logsContent.push(message);
  }

  function findFish() {
    return ((roll100() + mods.playerFishFindMod >= location.baseFishFind))
  }

  function pickFish() {
    if (roll100() <= fishPool.length) {
      const pick = pickFromArray(fishPool);
      setFishPool(removeElement(fishPool, pick));
      return pick;
    }
    else return new Fish(location, mods);
  }

  function rollForFishing() {
    let fish = pickFish(location, mods);

    addLogs(`You've enountered a ${fish.provideDescription()}! ${(fish.timesEncountered > 0) ? "You've seen this one before." : ''}`);

    let playerRoll = roll20(mods.playerVantage)
    let playerTotal = playerRoll + player.skill + mods.playerSkillMod;

    addLogs(`You rolled ${playerRoll}, for a total of ${playerTotal}. ${(playerRoll === 20) ? "It's a natural 20!" : ''}`);

    addLogs(`The fish required a roll of ${fish.requiredRoll} to catch.`);

    ((playerTotal >= fish.requiredRoll) || (playerRoll === 20)) ? isCatch(fish, playerTotal) : isNoCatch(fish);
  }

  function isCatch(fish, playerTotal) {
    player.gainXP(fish.xp);
    player.fishHistory.push({ fish, playerTotal });
    addLogs(`You've caught it! ${(fish.xp>0) ? `You gain ${fish.xp}xp` : 'That was easy!'}`)
  }

  function isNoCatch(fish) {
    //todo: modify fish based on player rolls.
    fish.timesEncountered++;
    setFishPool([...fishPool, fish])
    addLogs(`The ${fish.provideDescription()} got away.`)
  }

  function rollForTreasure() {
    if (roll100() - mods.playerTreasureFindMod <= location.baseTreasureFind)
      pickTreasure();
    else
      pickJunk();
  }

  function pickTreasure() {
    if (treasurePool.length === 0) {
      addLogs(`Looks like you've cleaned out this ${location.name} of all the good stuff.`);
      return
    }
    let treasure = pickFromArray(treasurePool);
    setTreasurePool(removeElement(treasurePool, treasure));
    player.inventory.push(treasure);
    addLogs(`You've found: ${treasure.name}. ${treasure.flavor}`);
  }

  function pickJunk() {
    let junk = pickRandom(location.junk);
    if (junk.uid === 0) {
      addLogs("You've found completely nothing. Well done!");
      setEventTrigger(eventTrigger+5);
    }
    else {
      player.junkPile.push(junk)
      addLogs(`You've found: ${junk.name}. ${junk.flavor}`)
    }
  }

  function checkEvents() {
    if (eventTrigger > 100) return true;
    else return false;
  }

  function noEvent() {
    setEventTrigger(eventTrigger + roll20());
  }

  function randomEvent() {
    addLogs("Something random happens.");
    setEventTrigger(0);
  }

  function launchCallbacks(callbackArray) {
    if (callbackArray.length === 0) return;
    callbackArray.forEach(callback => callback());
  }

  function playGame() {
    findFish()
      ? rollForFishing()
      : rollForTreasure();
    checkEvents()
      ? randomEvent()
      : noEvent();
    launchCallbacks(mods.extraCallbacks);
    setLogs(logsContent);
  }

  return <Button cname="Button-big Button-MainButton" callback={playGame}>{buttonText}</Button>
}

