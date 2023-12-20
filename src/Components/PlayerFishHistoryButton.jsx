import { useState } from "react";
import Button from "./Button";

export default function PlayerFishHistoryButton({ playerHistory }) {

  let [historyButtonState, setHistoryButtonState] = useState(true)
  let historyButtonText = historyButtonState ? 'Show History' : 'Hide History';

  function historyButtonFunction() {
    let historyOutput = [];
    if (historyButtonState) {
      historyOutput = playerHistory.map(
        ({ fish, playerTotal }) =>
          `${fish.provideDescription()}, roll required: ${fish.requiredRoll}, your roll: ${playerTotal}, xp gained: ${fish.xp}`,
      );
    };
    setLogs(historyOutput);
    setHistoryButtonState(!historyButtonState);
  }
  return <Button disabled={!playerHistory.length} cname="Button-small" callback={historyButtonFunction}>
    {historyButtonText}
  </Button>
}
