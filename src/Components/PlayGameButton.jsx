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
import { roll20, roll100, pickRandom } from "../Functions/helpers";

export default function GameButton(props) {
  let { location, player, modState, setModState, setLogs } = props;

  let [buttonText, setButtonText] = useState('Roll!')
  let [eventTrigger, setEventTrigger] = useState(0)
  let logsContent = '';

  function findFish(location, mods) {
    return (roll100() + mods.playerFishFindMod >= location.baseFishFind)
  }

  function rollForFishing(location, mods, setLogs) {
    //generate a fish(location, mods) - return fish with required roll after mods
    //roll 20(advantage, disadvantage) - return roll(s)
    //add player fishing skill
    //compare rolls, catch/nocatch(generated fish)
    //set appropriate logs
  }

  function isCatch(fish, player) {
    //add fish to history
    //add xp to player
  }
  function isNoCatch(fish) {
    //add fish to fishpool
    //set appropriate logs
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
    //pick random from location.junk table
    //if uid = 0, message about getting totally nothing
    //else add to player.junkpile, modify message
  }

  function checkEvents(eventTrigger) {
    if (eventTrigger>100) return true;
    else return false;
  }

  function noEvent() {
    setEventTrigger(eventTrigger+roll20())
  }

  function randomEvent() {

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
    launchCallbacks(modState.extraCallbacks)
    //possibly put the logs together and return them in one batch
  }

  return <Button callback={playGame}>{buttonText}</Button>
}

