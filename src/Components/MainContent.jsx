import StartScreen from './StartScreen';
import Button from './Button';
import Container from './Container';
import DevTools from './DevTools';
import EventLog from './Eventlog';
import PlayerInfo from './PlayerInfo';
import PlayGameButton from './PlayGameButton';
import { useState } from 'react';

export default function MainContent({ currentLocation, setCurrentLocation, currentPlayer, setCurrentPlayer, logs = [] }) {
  let classIngame = currentPlayer ? '-ingame' : '';
  let [logsState, setLogs] = useState(logs);
  let [historyButtonState, setHistoryButtonState] = useState(true)
  let historyButtonText = historyButtonState ? 'Show History' : 'Hide History';
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

  function historyButtonFunction() {
    let historyOutput = [];
    if (historyButtonState) {
      historyOutput = currentPlayer.fishHistory.map(
        ({ fish, playerTotal }) =>
          `${fish.provideDescription()}, roll required: ${fish.requiredRoll}, your roll: ${playerTotal}, xp gained: ${fish.xp}`,
      );
    };
    setLogs(historyOutput);
    setHistoryButtonState(!historyButtonState);
  }

  if (currentPlayer) {
    return (
      <Container cname={`App-main${classIngame}`}>
        <PlayerInfo player={currentPlayer} />
        <PlayGameButton location={currentLocation} player={currentPlayer} mods={modState} setLogs={setLogs} />
        <br />
        <Button disabled={!currentPlayer.fishHistory.length} cname="Button-small" callback={historyButtonFunction}>
          {historyButtonText}
        </Button>
        <Button disabled={!currentPlayer.inventory.length} cname="Button-small">Inventory</Button>
        <EventLog>{logsState}</EventLog>
        <DevTools location={currentLocation} mods={modState} setMods={setModState} />
      </Container>
    );
  } else
    return <StartScreen player={currentPlayer} setCurrentPlayer={setCurrentPlayer} />;
}
