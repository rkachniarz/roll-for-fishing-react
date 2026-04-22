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
import ItemTooltip from './ItemTooltip';
import { pickFromArray } from '../Functions/helpers';
import Weather from './Weather';
import { year } from '../Data/weather';
import LocationInfo from './LocationInfo';

export default function MainContent({
  currentLocation,
  setCurrentLocation,
  currentPlayer,
  setCurrentPlayer,
  logs = [],
}) {
  let classIngame = currentPlayer ? '-ingame' : '';
  let [currentSpot, setCurrentSpot] = useState(pickFromArray(currentLocation.spots));
  let [currentSeason, setSeason] = useState(pickFromArray(year));
  let [currentWeather, setWeather] = useState(pickFromArray(currentSeason.weathers));
  let [seasonDay, setSeasonDay] = useState(1);
  let [logsState, setLogs] = useState(logs);
  let [historyButtonState, setHistoryButtonState] = useState(true);
  let [itemToDisplay, setItemToDisplay] = useState({});
  let [modState, setModState] = useState({
    playerVantage: 0,
    playerSkillMod: 0,
    playerFishFindMod: 0,
    playerTreasureFindMod: 0,
    fishVantage: 0,
    fishDifficultyMod: 0,
    fishSizeIndexMod: 0,
    fishXPmod: 0,
    extraCallbacks: [],
  });

  if (currentPlayer) {
    return (
      <Container cname={`App-main${classIngame}`}>
        <Weather
          currentSeason={currentSeason}
          setSeason={setSeason}
          currentWeather={currentWeather}
          setWeather={setWeather}
          seasonDay={seasonDay}
          setSeasonDay={setSeasonDay}
          setLogs={setLogs}
        />
        <PlayerInfo player={currentPlayer} mods={modState} />
        <LocationInfo
          location={currentLocation}
          spot={currentSpot}
          currentSeason={currentSeason}
          currentWeather={currentWeather}
          seasonDay={seasonDay}
        />
        <PlayGameButton
          location={currentLocation}
          spot={currentSpot}
          player={currentPlayer}
          mods={modState}
          setLogs={setLogs}
          historyButtonState={historyButtonState}
          setHistoryButtonState={setHistoryButtonState}
          currentSeason={currentSeason}
          setCurrentSeason={setSeason}
          seasonDay={seasonDay}
          setSeasonDay={setSeasonDay}
        />
        <br />
        <PlayerFishHistoryButton
          playerHistory={currentPlayer.fishHistory}
          setLogs={setLogs}
          historyButtonState={historyButtonState}
          setHistoryButtonState={setHistoryButtonState}
        />
        <Button disabled={!currentPlayer.inventory.length} cname="Button-small">
          Inventory
        </Button>
        <EventLog>{logsState}</EventLog>
        <PlayerInventory
          inventory={currentPlayer.inventory}
          mods={modState}
          setMods={setModState}
          setItemTooltip={setItemToDisplay}
        />
        <DevTools location={currentLocation} mods={modState} setMods={setModState} />
        <ItemTooltip item={itemToDisplay} />
      </Container>
    );
  } else return <StartScreen player={currentPlayer} setCurrentPlayer={setCurrentPlayer} />;
}
