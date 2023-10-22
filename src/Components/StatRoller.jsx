import {useEffect, useState} from 'react';
import { getRandomNumber } from '../Functions/helpers';
import Button from './Button';
import { classes } from "../Functions/player";

export default function StatRoller(props){
let playerClass = classes[props.classId];

function rollStats(playerClass){
  return {
    skill: getRandomNumber(playerClass.skillMin, playerClass.skillMax),
    treasureFind: getRandomNumber(playerClass.treasureFindMin, playerClass.treasureFindMax),
    fishFind: getRandomNumber(playerClass.fishFindMin, playerClass.fishFindMax)
  }
}

function rerollStats(e){
  e.preventDefault();
  setRolledStats(rollStats(playerClass))
}

let [rolledStats, setRolledStats] = useState(rollStats(playerClass));

useEffect(()=>{
  setRolledStats(rollStats(playerClass))}, [playerClass])

  return(
    <div>
      <Button callback={rerollStats}>Roll Stats</Button>
      <p>{playerClass.name}</p>
      <label htmlFor="skill">Fishing Skill:</label>
      <input id="skill" type="text" value={rolledStats.skill} disabled/>
      <label htmlFor="fishFind">Fish Finding:</label>
      <input id="fishFind" type="text" value={rolledStats.fishFind} disabled/>
      <label htmlFor="treasureFind">Treasure Finding:</label>
      <input id="treasureFind" type="text" value={rolledStats.treasureFind} disabled/>
    </div>
  )

}
