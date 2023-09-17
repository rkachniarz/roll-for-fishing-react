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

function buttonFunction(){
    let [p, l] = playGame(location, player);
    setPlayerState(p);
    setLogsState(l);
  };

  if (player) {
    return (
      <Container cname={`App-main${classIngame}`}>
        <PlayerInfo player={playerState} />
        <Button cname="Button-big Button-MainButton" callback={buttonFunction}>
          Roll!
        </Button>
        <br />
        <Button cname="Button-small">Show History</Button>
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
