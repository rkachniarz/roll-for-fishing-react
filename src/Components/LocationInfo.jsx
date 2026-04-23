import Container from './Container';

export default function LocationInfo({ location, spot, currentSeason, currentWeather, seasonDay }) {
  function getTemperatureDescription() {
    const t = currentWeather.temperature;
    if (t === 0) return 'Extremely cold';
    if (t <= 3) return 'Cold';
    if (t <= 6) return 'Moderate';
    if (t <= 9) return 'Just right';
    if (t <= 12) return 'Warm';
    if (t <= 14) return 'Hot';
    return 'Extremely hot';
  }

  function getWindDescription() {
    const windDescriptions = ['None', 'Light', 'Moderate', 'Considerable', 'Strong', 'Extreme'];
    return windDescriptions[currentWeather.wind];
  }
  function getCloudsDescription() {
    const cloudDescriptions = ['None', '🌤', '⛅', '🌥', '☁', '⬛'];
    return cloudDescriptions[currentWeather.clouds];
  }
  function getPrecipitationDescription() {
    const precipitationDescriptions = ['None', 'Moist air', 'Light', 'Constant', 'Intense', 'Extreme'];
    return precipitationDescriptions[currentWeather.precipitation];
  }

  return (
    <Container cname="InfoPanel">
      <span>
        {location.name}, {spot.name}
      </span>
      <br />
      <span>
        {currentSeason.name}, day {seasonDay}
      </span>
      <br />
      <span>{currentWeather.shortDescription}</span>
      <br />
      <span>Temperature: {getTemperatureDescription()}</span>
      <br />
      <span>Wind: {getWindDescription()}</span>
      <br />
      <span>Clouds: {getCloudsDescription()}</span>
      <br />
      <span>Precipitation: {getPrecipitationDescription()}</span>
    </Container>
  );
}
