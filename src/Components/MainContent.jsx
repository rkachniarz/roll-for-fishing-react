import { playGame } from '../Functions/game';
import StartScreen from './StartScreen';
import Button from './Button';
import Container from './Container';
import DevTools from './DevTools';
import EventLog from './Eventlog';
import PlayerInfo from './PlayerInfo';
import { useState } from 'react';

export default function MainContent({ currentLocation, setCurrentLocation, currentPlayer, setCurrentPlayer, logs = [] }) {
  let classIngame = currentPlayer ? '-ingame' : '';
  let [logsState, setLogsState] = useState(logs);
  let [historyButtonState, setHistoryButtonState] = useState(true)
  let historyButtonText = historyButtonState ? 'Show History' : 'Hide History';


  function mainButtonFunction() {
    let [p, l] = playGame(currentLocation, currentPlayer);
    setCurrentPlayer(p);
    setLogsState(l);
    if (!historyButtonState) setHistoryButtonState(!historyButtonState);
  }

  function historyButtonFunction() {
    let historyOutput = [];
    if (historyButtonState) {
      historyOutput = currentPlayer.fishHistory.map(
        ({ fish, rollTotal }) =>
          `${fish.provideDescription()}, roll required: ${fish.requiredRoll}, your roll: ${rollTotal}, xp gained: ${fish.xp
          }`,
      );
    };
    setLogsState(historyOutput);
    setHistoryButtonState(!historyButtonState);
  }

  if (currentPlayer) {
    return (
      <Container cname={`App-main${classIngame}`}>
        <PlayerInfo player={currentPlayer} />
        <Button cname="Button-big Button-MainButton" callback={mainButtonFunction}>
          Roll!
        </Button>
        <br />
        <Button disabled={!currentPlayer.fishHistory.length} cname="Button-small" callback={historyButtonFunction}>
          {historyButtonText}
        </Button>
        <Button disabled={!currentPlayer.inventory.length} cname="Button-small">Inventory</Button>
        <EventLog>{logsState}</EventLog>
        <DevTools player={currentPlayer} />
      </Container>
    );
  } else
    return <StartScreen player={currentPlayer} setCurrentPlayer={setCurrentPlayer} />;
}
