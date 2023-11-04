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

// playerAdvantage: false,
// playerDisadvantage: false,
// playerSkillMod: 0,
// playerFishFindMod: 0,
// playerTreasureFindMod: 0,
// fishAdvantage: false,
// fishDisadvantage: false,
// fishDifficultyMod: 0,
// fishSizeModArray: [],
// extraCallbacks: []


*/



import { useState } from "react"

export default function GameButton(props) {
  let { location, player, modState } = props;
  let [buttonText, setButtonText] = useState('Roll!')
  let [eventChance, setEventChance] = useState(0)

  function playGame(location, modState) {
    findFish(location, modState.playerFishFindMod)
      ? rollForFishing(location, modState)
      : rollForTreasure(location, playerTreasureFindMod);
    checkEvents(eventChance)
      ? randomEvent()
      : noEvent();
    launchCallbacks(modState.extraCallbacks)


  }




  return <Button callback={playGame}>{buttonText}</Button>
}
