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
import { saveGame as persistGame, loadGame } from '../Functions/storage';
import RecordBook from './RecordBook';

export default function MainContent({
  currentLocation,
  setCurrentLocation,
  currentPlayer,
  setCurrentPlayer,
  logs = [],
}) {
  let classIngame = currentPlayer ? '-ingame' : '';
  const save = loadGame();
  const savedWorld = save?.world;
  const initialSeason = (savedWorld && year[savedWorld.seasonIndex]) ?? pickFromArray(year);
  const initialWeather =
    (savedWorld && initialSeason.weathers[savedWorld.weatherIndex]) ?? pickFromArray(initialSeason.weathers);
  const initialSeasonDay = savedWorld?.seasonDay ?? 1;
  let [currentSpot, setCurrentSpot] = useState(pickFromArray(currentLocation.spots));
  let [currentSeason, setSeason] = useState(initialSeason);
  let [currentWeather, setWeather] = useState(initialWeather);
  let [seasonDay, setSeasonDay] = useState(initialSeasonDay);
  let [logsState, setLogs] = useState(logs);
  let [historyButtonState, setHistoryButtonState] = useState(true);
  let [itemToDisplay, setItemToDisplay] = useState({});
  let [recordBookOpen, setRecordBookOpen] = useState(false);
  let [inventoryOpen, setInventoryOpen] = useState(false);
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
          currentWeather={currentWeather}
          setCurrentWeather={setWeather}
          saveGame={() => persistGame(currentPlayer, currentSeason, currentWeather, seasonDay)}
        />
        <br />
        <PlayerFishHistoryButton
          playerHistory={currentPlayer.fishHistory}
          setLogs={setLogs}
          historyButtonState={historyButtonState}
          setHistoryButtonState={setHistoryButtonState}
        />
        <Button
          disabled={!currentPlayer.fishHistory.length}
          cname="Button-small"
          callback={() => setRecordBookOpen(true)}
        >
          Record Book
        </Button>
        <RecordBook player={currentPlayer} active={recordBookOpen} onClose={() => setRecordBookOpen(false)} />
        <Button
          disabled={!currentPlayer.inventory.items.length}
          cname="Button-small"
          callback={() => setInventoryOpen(true)}
        >
          Inventory
        </Button>
        <EventLog>{logsState}</EventLog>
        <PlayerInventory
          inventory={currentPlayer.inventory}
          active={inventoryOpen}
          onClose={() => setInventoryOpen(false)}
          mods={modState}
          setMods={setModState}
          setItemTooltip={setItemToDisplay}
        />
        <DevTools location={currentLocation} player={currentPlayer} />
        <ItemTooltip tooltip={itemToDisplay} />
      </Container>
    );
  } else return <StartScreen player={currentPlayer} setCurrentPlayer={setCurrentPlayer} />;
}
