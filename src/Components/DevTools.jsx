import clsx from 'clsx';
import Modal from './Modal';
import Button from './Button';
import { useState } from 'react';
import Container from './Container';
import Item from './Item';
import { roll6, roll2d6, pickFromArray } from '../Functions/helpers';

let testItem = {
  uid: 5,
  name: 'Four-leaf underwater clover',
  icon: '🍀',
  description: 'Advantage on fishing rolls. +3 fish difficulty.',
  flavor: 'You are so lucky, you only find the GOOD fish.',
  mechanics: { playerSkillMod: 10, playerVantage: -1 },
  active: false,
};

//[n, ne, se, s, sw, nw]
// let basic_moveset = [
//   [1, 2, 3, 4, 5, 6],
//   [8, 9, 2, 0, 6, 7],
//   [9, 10, 11, 3, 0, 1],
//   [2, 11, 12, 13, 4, 0],
//   [0, 3, 13, 14, 15, 5],
//   [6, 0, 4, 15, 16, 17],
//   [7, 1, 0, 5, 17, 18],
//   [15, 8, 1, 6, 18, 11],
//   [14, 18, 9, 1, 7, 10],
//   [13, 17, 10, 2, 1, 8],
//   [12, 16, 8, 11, 2, 9],
//   [10, 15, 7, 12, 3, 2],
//   [11, 14, 18, 10, 13, 3],
//   [3, 12, 17, 9, 14, 4],
//   [4, 13, 16, 8, 12, 15],
//   [5, 4, 14, 7, 11, 16],
//   [17, 5, 15, 18, 10, 14],
//   [18, 6, 5, 16, 9, 13],
//   [16, 7, 6, 17, 8, 12]
// ]
let spring = [
  [1, 2, 3, 4, 5, 6],
  [8, 9, 2, 0, 6, 7],
  [9, 10, 11, 3, 0, 1],
  [2, 11, 12, 13, 4, 0],
  [0, 3, 13, 14, 15, 5],
  [6, 0, 4, 15, 16, 17],
  [7, 1, 0, 5, 17, 18],
  [7, 8, 1, 6, 18, 11],
  [8, 18, 9, 1, 7, 10],
  [13, 17, 10, 2, 1, 8],
  [12, 10, 8, 11, 2, 9],
  [10, 11, 7, 12, 3, 2],
  [11, 14, 18, 10, 13, 3],
  [3, 12, 13, 9, 14, 4],
  [4, 13, 16, 14, 12, 15],
  [5, 4, 14, 15, 15, 16],
  [17, 5, 15, 18, 16, 14],
  [18, 6, 5, 16, 9, 17],
  [16, 7, 6, 17, 8, 12],
];
let summer_full = {
  name: 'Summer',
  nextSeason: autumn,
  weathers: [
    {
      shortDescription: 'Pleasantly warm',
      longDescription: 'It is pleasantly warm.',
      temperature: 3,
      wind: 0,
      precipitation: 0,
      clouds: 1,
      changeSet: [1, 2, 3, 4, 5, 6],
    },
    {
      shortDescription: 'Cloudy and humid',
      longDescription: `It's cloudy and humid.`,
      temperature: 1,
      wind: 0,
      precipitation: 1,
      clouds: 3,
      changeSet: [8, 9, 2, 0, 6, 7],
    },
    {
      shortDescription: 'Cloudy and windy',
      longDescription: 'Strong winds move plentiful clouds across the sky.',
      temperature: 2,
      wind: 3,
      precipitation: 0,
      clouds: 3,
      changeSet: [9, 10, 11, 3, 0, 1],
    },
    {
      shortDescription: 'Warm breeze',
      longDescription: 'The wind blows warm air in your face.',
      temperature: 4,
      wind: 2,
      precipitation: 0,
      clouds: 1,
      changeSet: [2, 11, 12, 13, 4, 0],
    },
    {
      shortDescription: 'Hot and dry',
      longDescription: 'The air is hot and unmoving.',
      temperature: 5,
      wind: 0,
      precipitation: 0,
      clouds: 0,
      changeSet: [0, 3, 13, 14, 15, 5],
    },
    {
      shortDescription: 'Warm and cloudy',
      longDescription: 'Numerous clouds provide much-needed shade.',
      temperature: 4,
      wind: 1,
      precipitation: 0,
      clouds: 2,
      changeSet: [6, 0, 4, 15, 16, 17],
    },
    {
      shortDescription: 'Short, warm showers',
      longDescription: 'Occasional rain makes the warm air feel like soup.',
      temperature: 3,
      wind: 2,
      precipitation: 2,
      clouds: 3,
      changeSet: [7, 1, 0, 5, 17, 18],
    },
    {
      shortDescription: 'Downpour',
      longDescription: 'A wall of rain makes it hard to see far.',
      temperature: 2,
      wind: 1,
      precipitation: 4,
      clouds: 4,
      changeSet: [7, 8, 1, 6, 18, 11],
    },
    {
      shortDescription: 'Torrential rain',
      longDescription: `Strong winds make it seem like it's raining sideways.`,
      temperature: 0,
      wind: 4,
      precipitation: 4,
      clouds: 4,
      changeSet: [14, 18, 9, 1, 7, 10],
    },
    {
      shortDescription: 'Warm storm',
      longDescription: 'Thunder and lightning. The warm, wet air smells like summer.',
      temperature: 2,
      wind: 3,
      precipitation: 4,
      clouds: 4,
      changeSet: [9, 17, 10, 2, 1, 8],
    },
    {
      shortDescription: 'Fierce wind',
      longDescription: 'This wind means business.',
      temperature: 2,
      wind: 4,
      precipitation: 0,
      clouds: 2,
      changeSet: [12, 10, 8, 11, 2, 9],
    },
    {
      shortDescription: 'Nippy, partly cloudy',
      longDescription: 'It gets cold when the sun hides behind the clouds.',
      temperature: 2,
      wind: 0,
      precipitation: 0,
      clouds: 2,
      changeSet: [10, 15, 7, 12, 3, 2],
    },
    {
      shortDescription: 'Clear and nippy',
      longDescription: 'Light wind carries cold air.',
      temperature: 2,
      wind: 2,
      precipitation: 0,
      clouds: 0,
      changeSet: [11, 14, 18, 10, 13, 3],
    },
    {
      shortDescription: 'Sunny and clear',
      longDescription: 'Clear skies and no wind.',
      temperature: 4,
      wind: 0,
      precipitation: 0,
      clouds: 0,
      changeSet: [3, 12, 17, 13, 14, 4],
    },
    {
      shortDescription: 'Dry heat surges',
      longDescription: 'Hot, dry air makes you feel like a fry.',
      temperature: 5,
      wind: 0,
      precipitation: 0,
      clouds: 0,
      changeSet: [4, 13, 16, 14, 12, 15],
    },
    {
      shortDescription: 'Hot and windy',
      longDescription: 'The wind blows hot air in your face.',
      temperature: 5,
      wind: 2,
      precipitation: 0,
      clouds: 0,
      changeSet: [5, 4, 14, 15, 11, 16],
    },
    {
      shortDescription: 'Hot and muggy',
      longDescription: 'Hot, wet air makes everything sticky.',
      temperature: 5,
      wind: 0,
      precipitation: 1,
      clouds: 1,
      changeSet: [17, 5, 15, 18, 16, 14],
    },
    {
      shortDescription: 'Warm drizzle',
      longDescription: 'A bit of rain makes the heat bearable.',
      temperature: 4,
      wind: 1,
      precipitation: 2,
      clouds: 2,
      changeSet: [18, 6, 5, 16, 9, 13],
    },
    {
      shortDescription: 'Warm rain',
      longDescription: 'It feels like nature giving you a shower.',
      temperature: 3,
      wind: 1,
      precipitation: 3,
      clouds: 3,
      changeSet: [16, 7, 6, 17, 8, 12],
    },
  ],
};

let summer = [
  [1, 2, 3, 4, 5, 6],
  [8, 9, 2, 0, 6, 7],
  [9, 10, 11, 3, 0, 1],
  [2, 11, 12, 13, 4, 0],
  [0, 3, 13, 14, 15, 5],
  [6, 0, 4, 15, 16, 17],
  [7, 1, 0, 5, 17, 18],
  [7, 8, 1, 6, 18, 11],
  [14, 18, 9, 1, 7, 10],
  [9, 17, 10, 2, 1, 8],
  [12, 10, 8, 11, 2, 9],
  [10, 15, 7, 12, 3, 2],
  [11, 14, 18, 10, 13, 3],
  [3, 12, 17, 13, 14, 4],
  [4, 13, 16, 14, 12, 15],
  [5, 4, 14, 15, 11, 16],
  [17, 5, 15, 18, 16, 14],
  [18, 6, 5, 16, 9, 13],
  [16, 7, 6, 17, 8, 12],
];
let autumn = [
  [1, 2, 3, 4, 5, 6],
  [8, 9, 2, 0, 6, 7],
  [9, 10, 11, 3, 0, 1],
  [2, 11, 12, 13, 4, 0],
  [0, 3, 13, 14, 15, 5],
  [6, 0, 4, 15, 16, 17],
  [7, 1, 0, 5, 17, 18],
  [7, 8, 1, 6, 18, 7],
  [14, 18, 9, 1, 7, 8],
  [13, 17, 10, 2, 1, 8],
  [12, 16, 10, 11, 2, 9],
  [10, 15, 11, 12, 3, 2],
  [11, 14, 18, 10, 13, 3],
  [3, 12, 17, 9, 14, 4],
  [4, 13, 16, 8, 12, 15],
  [5, 4, 14, 15, 11, 16],
  [17, 5, 15, 16, 10, 14],
  [18, 6, 5, 16, 9, 13],
  [18, 7, 6, 17, 8, 12],
];

let winter = [
  [1, 2, 3, 4, 5, 6],
  [8, 9, 2, 0, 6, 7],
  [9, 10, 11, 3, 0, 1],
  [2, 11, 12, 13, 4, 0],
  [0, 3, 13, 14, 15, 5],
  [6, 0, 4, 15, 16, 17],
  [7, 1, 0, 5, 17, 18],
  [7, 8, 1, 6, 18, 11],
  [8, 18, 9, 1, 7, 10],
  [13, 17, 10, 2, 1, 8],
  [12, 10, 8, 11, 2, 9],
  [10, 15, 7, 12, 3, 2],
  [11, 14, 18, 10, 13, 3],
  [3, 12, 17, 9, 14, 4],
  [4, 13, 16, 14, 12, 15],
  [5, 4, 14, 15, 11, 16],
  [17, 5, 15, 18, 16, 14],
  [18, 6, 5, 16, 9, 13],
  [16, 7, 6, 17, 8, 12],
];

export default function DevTools({ location, mods, setMods }) {
  let [modalOpen, setModalOpen] = useState(false);
  let [currentSeason, setSeason] = useState(summer_full);
  let [currentWeather, setWeather] = useState(pickFromArray(currentSeason.weathers));
  let [seasonDay, setSeasonDay] = useState(1);

  function changeWeather() {
    const direction = getChangeDirection();
    if (direction == -1) return;
    const newWeatherIndex = currentWeather.changeSet[direction];

    if (newWeatherIndex === currentSeason.weathers.indexOf(currentWeather)) return;
    else setWeather(currentSeason.weathers[newWeatherIndex]);
    //set logs that the weather has changed
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
        setSeason(currentSeason.nextSeason);
        setSeasonDay(1);
      }
    }
  }

  const modalContent = (
    <Container cname="App-main">
      <Container>
        <p>Siema</p>
        <Button cname="Button-small" callback={toggleModal}>
          Nara
        </Button>
      </Container>
      <Container>
        <p>Current season is: {currentSeason.name}</p>
        <p>Current weather is: {currentWeather.shortDescription}</p>
        <Button cname="Button-small" callback={changeWeather}>
          Change Weather
        </Button>
      </Container>
      <Container cname="Inventory-outer CenterFlex">
        <Container cname="Inventory-inner">
          <Item item={testItem} mods={mods} setMods={setMods}></Item>
        </Container>
      </Container>
    </Container>
  );

  function toggleModal() {
    setModalOpen(!modalOpen);
  }

  return (
    <div>
      <button onClick={toggleModal}>Open Debug Modal</button>
      <Modal cname="Debug" active={modalOpen}>
        {modalContent}
      </Modal>
    </div>
  );
}
