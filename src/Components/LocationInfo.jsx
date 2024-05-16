import Container from './Container';

function LocationInfo({ location, currentSeason, currentWeather, seasonDay }) {
  function getTemperatureDescription() {
    switch (currentWeather.temperature) {
      case 0:
        return 'Extremely cold';
      case 1:
      case 2:
      case 3:
        return 'Cold';
      case 4:
      case 5:
      case 6:
        return 'Moderate';
      case 7:
      case 8:
      case 9:
        return 'Just right';
      case 10:
      case 11:
      case 12:
        return 'Warm';
      case 13:
      case 14:
        return 'Hot';
      case 15:
        return 'Extremely Hot';
      default:
        return 'Strange';
    }
  }

  function getWindDescription() {
    const windDescriptions = ['None', 'Light', 'Moderate', 'Considerable', 'Strong'];
    return windDescriptions[currentWeather.wind];
  }
  function getCloudsDescription() {
    const cloudDescriptions = ['None', '🌤', '⛅', '🌥', '☁'];
    return cloudDescriptions[currentWeather.clouds];
  }
  function getPrecipitationDescription() {
    const precipitationDescriptions = ['None', 'Moist air', 'Light', 'Constant', 'Intense'];
    return precipitationDescriptions[currentWeather.precipitation];
  }

  return (
    <Container>
      <p>
        {location.name}, {location.spot.name}
      </p>
      <p>
        {currentSeason.name}, day {seasonDay}
      </p>
      <p>{currentWeather.shortDescription}</p>
      <p>Temperature: {getTemperatureDescription()}</p>
      <p>Wind: {getWindDescription()}</p>
      <p>Clouds: {getCloudsDescription()}</p>
      <p>Precipitation: {getPrecipitationDescription()}</p>
    </Container>
  );
}
