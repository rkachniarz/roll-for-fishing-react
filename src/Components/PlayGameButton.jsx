/*
atoms:

message:
  fish found message
  junk found message
  treasure found message
  rollmessage
  nat1message
  failmessage
  catchmessage
  nat20message

play game:
  TBD: roll for fish finding
    if fish:
      generate fish [get location and mods from props]
      generate player roll
          catch: add to history, remove from pool if came from pool
          fail: add to pool. mark as poolfish.
      display appropriate messages
   if no fish:
      roll for junk/treasure
      add junk to player.junk pile
      add treasure to inventory
  TBD: roll for random events
  resolve other effects [ get from props ]

*/

const mods = {
  playerAdvantage: false,
  playerDisadvantage: false,
  playerSkillMod: 0,
  playerFishFindMod: 0,
  playerTreasureFindMod: 0,
  fishAdvantage: false,
  fishDisadvantage: false,
  fishDifficultyMod: 0,
  fishSizeModArray: [],
  extraCallbacks: []
}

const location = {
  name: '',
  baseFishFind: 50,
  baseTreasureFind: 5,
  fish: [],
  treasure: [],
  junk: []
}

import { useState } from "react";
import { roll20, roll100, pickRandom, pickFromArray, removeElement } from "../Functions/helpers";
import { Fish } from "../Functions/fish";

export default function GameButton(props) {
  let { location, player, setPlayer, mods, setMods, setLogs } = props;

  let [buttonText, setButtonText] = useState('Roll!');
  let [eventTrigger, setEventTrigger] = useState(0);
  let [fishPool, setFishPool] = useState([]);
  let [treasurePool, setTreasurePool] = useState(location.treasurePool);



  let logsContent = '';

  function addLogs(message) {
    logsContent += `<p>{message}</p>`
  }

  function findFish(location, mods) {
    return (roll100() + mods.playerFishFindMod >= location.baseFishFind)
  }

  function pickFish(location, mods) {
    if (roll100() < fishPool.length) {
      const pick = pickFromArray(fishPool);
      setFishPool(removeElement(fishPool, pick));
      return pick;
    }
    else return new Fish(location, mods);
  }

  function rollForFishing() {
    let fish = pickFish(location, mods);

    addLogs(`You've enountered a ${fish.provideDescription}!`);

    let playerRoll = roll20(mods.playerAdvantage, mods.playerDisadvantage)
    let playerTotal = playerRoll + player.skill + mods.playerSkillMod;

    addLogs(`You rolled ${playerRoll}, for a total of ${playerTotal}. ${(playerRoll === 20) && "It's a natural 20!"}`);

    addLogs(`The fish required a roll of ${fish.requiredRoll} to catch.`);

    ((playerTotal >= fish.requiredRoll) || (playerRoll === 20)) ? isCatch(fish) : isNoCatch(fish);
  }

  function isCatch(fish) {
    player.gainXP(fish.xp);
    player.fishHistory.push({ fish, rollTotal });
    addLogs(`You've caught it!`)
  }
  function isNoCatch(fish) {
    //todo: modify fish based on player rolls. add counter to fish.
    setFishPool([...fishPool, fish])
    logsContent += `<p>The ${fish.provideDescription} got away. </p>`
  }

  function rollForTreasure(location, mods, setLogs) {
    if (roll100() + mods.playerTreasureFindMod >= location.baseTreasureFind)
      pickTreasure();
    else
      pickJunk();
  }

  function pickTreasure(location, player, mods, setLogs) {
    //pick random from location.treasure table
    //add to player.inventory, activate
    //modify message
  }

  function pickJunk(location, player) {
    let junk = pickRandom(location.junk);
    if (!(junk.uid === 0)) addLogs("You've found completely nothing. Well done!");
    else {
      player.junkPile.push(junk)
      addLogs(`You've found ${junk.name}. ${junk.flavor}`)
    }
  }

  function checkEvents() {
    if (eventTrigger > 100) return true;
    else return false;
  }

  function noEvent() {
    setEventTrigger(eventTrigger + roll20())
  }

  function randomEvent() {
    addLogs("Something random happens.");
  }

  function launchCallbacks(callbackArray) {
    if (callbackArray.length === 0) return;
    callbackArray.forEach(callback => callback());
  }

  function playGame() {
    findFish(location, modState.playerFishFindMod)
      ? rollForFishing(location, modState, setLogs)
      : rollForTreasure(location, playerTreasureFindMod, setLogs);
    checkEvents(eventTrigger)
      ? randomEvent()
      : noEvent();
    launchCallbacks(modState.extraCallbacks);
    setLogs(logsContent);
  }

  return <Button callback={playGame}>{buttonText}</Button>
}

