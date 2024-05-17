import Button from './Button';
import Container from './Container';
import { roll6, roll2d6, pickFromArray, getRandomNumber } from '../Functions/helpers';
import { year } from '../Data/weather';

export default function Weather({
  currentSeason,
  setSeason,
  currentWeather,
  setWeather,
  seasonDay,
  setSeasonDay,
  setLogs,
  debug = false,
}) {
  function changeWeather() {
    const direction = getChangeDirection();
    if (direction == -1) return;
    const newWeatherIndex = currentWeather.changeSet[direction];

    if (newWeatherIndex === currentSeason.weathers.indexOf(currentWeather)) return;
    else setWeather(currentSeason.weathers[newWeatherIndex]);
    setLogs();
    progressSeason();
  }

  function getChangeDirection() {
    const possibleValues = [null, null, 5, 4, 4, 3, 3, 2, 1, -1, -1, 0, 5];
    return possibleValues[roll2d6()];
  }

  function progressSeason() {
    if (roll6() < 5) {
      setSeasonDay(seasonDay + 1);
      if (seasonDay > 90) {
        changeSeason();
      }
    }
  }

  function changeSeason() {
    let nextSeason = (year.indexOf(currentSeason) + 1) % year.length;
    setSeason(year[nextSeason]);
    setSeasonDay(1);
    setWeather(pickFromArray(currentSeason.weathers));
  }

  if (debug)
    return (
      <Container>
        <p>Current season is: {currentSeason.name}</p>
        <p>Current weather is: {currentWeather.shortDescription}</p>
        <p>{currentWeather.longDescription}</p>
        <p>Weather stats:</p>
        <p>Temperature: {currentWeather.temperature}</p>
        <p>Wind: {currentWeather.wind}</p>
        <p>Clouds: {currentWeather.clouds}</p>
        <p>Precipitation: {currentWeather.precipitation}</p>
        <Button cname="Button-small" callback={changeWeather}>
          Change Weather
        </Button>
        <Button cname="Button-small" callback={changeSeason}>
          Next Season
        </Button>
      </Container>
    );
}
