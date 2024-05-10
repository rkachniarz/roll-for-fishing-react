import { useState } from 'react';
import Button from './Button';

export default function PlayerFishHistoryButton({ playerHistory, setLogs, historyButtonState, setHistoryButtonState }) {
  let historyButtonText = historyButtonState ? 'Show History' : 'Hide History';

  function historyButtonFunction() {
    let historyOutput = [];
    if (historyButtonState) {
      historyOutput = playerHistory.map(
        ({ fish, playerTotal }) =>
          `${fish.provideDescription()}, roll required: ${fish.requiredRoll}, your roll: ${playerTotal}, xp gained: ${
            fish.xp
          }. ${fish.timesEncountered != 0 ? `Caught after ${fish.timesEncountered + 1} tries.` : ''}`,
      );
    }
    setLogs(historyOutput);
    setHistoryButtonState(!historyButtonState);
  }
  return (
    <Button disabled={!playerHistory.length} cname="Button-small" callback={historyButtonFunction}>
      {historyButtonText}
    </Button>
  );
}
