import { playGame } from '../Functions/game';
import { Button } from './Button';
import { Container } from './Container';
import { EventLog } from './Eventlog';
import { PlayerInfo } from './PlayerInfo';
import { useState } from 'react';

export function MainContent({ location, player, logs = [] }) {
  let classIngame = player ? '-ingame' : '';
  let [playerState, setPlayerState] = useState(player);
  let [logsState, setLogsState] = useState(logs);
  let [historyButtonState, setHistoryButtonState] = useState(true)
  let historyButtonText = historyButtonState ? 'Show History' : 'Hide History';

  let [modState, setModState] = useState({
    playerAdvantage: false,
    playerDisadvantage: false,
    playerSkillMod: 0,
    playerFishFindMod: 0,
    playerTreasureFindMod: 0,
    fishAdvantage: false,
    fishDisadvantage: false,
    fishDifficultyMod: 0,
    fishSizeModArray: [],
    extraMainButtonCallbacks: []
  })

  function mainButtonFunction() {
    let [p, l] = playGame(location, player, modState);
    setPlayerState(p);
    setLogsState(l);
    if (!historyButtonState) setHistoryButtonState(!historyButtonState);
  }

  function historyButtonFunction() {
    let historyOutput = [];
    if (historyButtonState) {
      historyOutput = playerState.fishHistory.map(
        ({ fish, rollTotal }) =>
          `${fish.provideDescription()}, roll required: ${fish.requiredRoll}, your roll: ${rollTotal}, xp gained: ${fish.xp
          }`,
      );
    };
    setLogsState(historyOutput);
    setHistoryButtonState(!historyButtonState);
  }

  if (player) {
    return (
      <Container cname={`App-main${classIngame}`}>
        <PlayerInfo player={playerState} />
        <Button cname="Button-big Button-MainButton" callback={mainButtonFunction}>
          Roll!
        </Button>
        <br />
        <Button cname="Button-small" callback={historyButtonFunction}>
          {historyButtonText}
        </Button>
        <Button cname="Button-small">Inventory</Button>
        <EventLog>{logsState}</EventLog>
      </Container>
    );
  } else
    return (
      <Container cname="App-main">
        <Button cname="Button-big">Create character</Button>
        <br />
        <Button cname="Button-big">Random character</Button>
      </Container>
    );
}
