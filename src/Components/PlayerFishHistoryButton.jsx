import { useState } from 'react';
import Button from './Button';

export default function PlayerFishHistoryButton({ playerHistory, setLogs, historyButtonState, setHistoryButtonState }) {
  let historyButtonText = historyButtonState ? 'Show History' : 'Hide History';

  function historyButtonFunction() {
    let historyOutput = [];
    if (historyButtonState) {
      historyOutput = playerHistory.map(
        (record) =>
          `${record.size} ${record.name} (${record.numericSize}cm), roll required: ${record.requiredRoll}, your roll: ${record.playerTotal}, xp gained: ${
            record.xp
          }. ${record.timesEncountered !== 0 ? `Caught after ${record.timesEncountered + 1} tries.` : ''}`,
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
