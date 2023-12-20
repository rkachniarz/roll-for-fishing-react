import StartScreen from './StartScreen';
import Button from './Button';
import Container from './Container';
import DevTools from './DevTools';
import EventLog from './Eventlog';
import PlayerInfo from './PlayerInfo';
import PlayGameButton from './PlayGameButton';
import { useState } from 'react';
import PlayerFishHistoryButton from './PlayerFishHistoryButton';
import PlayerInventory from './PlayerInventory';

export default function MainContent({ currentLocation, setCurrentLocation, currentPlayer, setCurrentPlayer, logs = [] }) {
  let classIngame = currentPlayer ? '-ingame' : '';
  let [logsState, setLogs] = useState(logs);
  let [modState, setModState] = useState({
    playerVantage: 0,
    playerSkillMod: 0,
    playerFishFindMod: 0,
    playerTreasureFindMod: 0,
    fishVantage: 0,
    fishDifficultyMod: 0,
    fishSizeModArray: [],
    fishXPmod: 0,
    extraCallbacks: []
  })



  if (currentPlayer) {
    return (
      <Container cname={`App-main${classIngame}`}>
        <PlayerInfo player={currentPlayer} mods={modState} />
        <PlayGameButton location={currentLocation} player={currentPlayer} mods={modState} setLogs={setLogs} />
        <br />
        <PlayerFishHistoryButton playerHistory={currentPlayer.fishHistory} />
        <Button disabled={!currentPlayer.inventory.length} cname="Button-small">Inventory</Button>
        <EventLog>{logsState}</EventLog>
        <PlayerInventory inventory={currentPlayer.inventory} mods={modState} setMods={setModState} />
        <DevTools location={currentLocation} mods={modState} setMods={setModState} />
      </Container>
    );
  } else
    return <StartScreen player={currentPlayer} setCurrentPlayer={setCurrentPlayer} />;
}
