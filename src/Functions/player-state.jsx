import { useState } from "react";




export default function Player() {
  let [playerName, setPlayerName] = useState('');
  let [playerClass, setPlayerClass] = useState(0);
  let [playerSkill, setPlayerSkill] = useState(0);
  let [playerTreasureFind, setPlayerTreasureFind] = useState(0);
  let [playerFishFind, setPlayerFishFind] = useState(0);
  let [playerExtraStats, setPlayerExtraStats] = useState([{ name: 'Luck', value: 0 }]);
  let [playerXP, setPlayerXP] = useState(0);
  let [playerLevel, setPlayerLevel] = useState(0);
  let [playerFishHistory, setPlayerFishHistory] = useState([]);
  let [playerInventory, setPlayerInventory] = useState({
    fishBucket: [],
    junk: [],
    common: [],
    uncommon: []
  })




}
