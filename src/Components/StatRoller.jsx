import { useEffect, useState } from 'react';
import { getRandomNumber } from '../Functions/helpers';
import Button from './Button';
import { classes } from "../Functions/player";

export default function StatRoller({ classId, playerStats, setPlayerStats }) {
  let playerClass = classes[classId];

  function rollStats(playerClass) {
    setPlayerStats({
      skill: getRandomNumber(playerClass.skillMin, playerClass.skillMax),
      treasureFind: getRandomNumber(playerClass.treasureFindMin, playerClass.treasureFindMax),
      fishFind: getRandomNumber(playerClass.fishFindMin, playerClass.fishFindMax)
    })
  }

  function rerollStats(e) {
    e.preventDefault();
    rollStats(playerClass);
  }

  useEffect(() => { rollStats(playerClass) }, [playerClass])

  return (
    <div>
      <Button callback={rerollStats}>Roll Stats</Button>
      <p>{playerClass.name}</p>
      <label htmlFor="skill">Fishing Skill:</label>
      <input id="skill" type="text" value={playerStats.skill} disabled />
      <label htmlFor="fishFind">Fish Finding:</label>
      <input id="fishFind" type="text" value={playerStats.fishFind} disabled />
      <label htmlFor="treasureFind">Treasure Finding:</label>
      <input id="treasureFind" type="text" value={playerStats.treasureFind} disabled />
    </div>
  )

}
