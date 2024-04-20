import clsx from "clsx";
import Modal from "./Modal";
import Button from "./Button";
import { useState } from "react";
import Container from "./Container";
import Item from "./Item";
import { getNodeText } from "@testing-library/react";

let testItem = {
  uid: 5,
  name: 'Four-leaf underwater clover',
  icon: '🍀',
  description: 'Advantage on fishing rolls. +3 fish difficulty.',
  flavor: 'You are so lucky, you only find the GOOD fish.',
  mechanics: { playerSkillMod: 10, playerVantage: -1 },
  active: false
}

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
  [16, 7, 6, 17, 8, 12]
]
let summer_full = [
  {
    shortDescription: 'Pleasantly warm',
    longDescription: 'It is pleasantly warm.',
    temperature: 2,
    wind: 0,
    precipitation: 0,
    clouds: 1,
    changeSet: [1, 2, 3, 4, 5, 6]
  },
  {
    shortDescription: 'Cloudy and humid',
    longDescription: `It's cloudy and humid.`,
    temperature: 1,
    wind: 0,
    precipitation: 1,
    clouds: 3,
    changeSet: [8, 9, 2, 0, 6, 7]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [9, 10, 11, 3, 0, 1]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [2, 11, 12, 13, 4, 0]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [0, 3, 13, 14, 15, 5]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [6, 0, 4, 15, 16, 17]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [7, 1, 0, 5, 17, 18]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [7, 8, 1, 6, 18, 11]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [14, 18, 9, 1, 7, 10]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [9, 17, 10, 2, 1, 8]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [12, 10, 8, 11, 2, 9]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [10, 15, 7, 12, 3, 2]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [11, 14, 18, 10, 13, 3]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [3, 12, 17, 13, 14, 4]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [4, 13, 16, 14, 12, 15]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [5, 4, 14, 15, 11, 16]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [17, 5, 15, 18, 16, 14]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [18, 6, 5, 16, 9, 13]
  },
  {
    shortDescription: '',
    longDescription: '',
    temperature: 0,
    wind: 0,
    precipitation: 0,
    clouds: 0,
    changeSet: [16, 7, 6, 17, 8, 12]
  },
]
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
  [16, 7, 6, 17, 8, 12]
]
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
  [18, 7, 6, 17, 8, 12]
]

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
  [16, 7, 6, 17, 8, 12]
]

let [currentSeason, setSeason] = useState(summer)
let [currentWeather, setWeather] = useState(null)

function changeWeather() {
  const direction = getChangeDirection();
  if (direction == -1) return;
  const newWeatherIndex = currentWeather.changeSet[direction]
  if (newWeatherIndex === currentSeason.indexOf(currentWeather)) return;
  else setWeather(currentSeason[newWeatherIndex])
}

function getChangeDirection() {
  const possibleValues = [null, null, 5, 4, 4, 3, 3, 2, 1, -1, -1, 0, 5];
  return possibleValues[roll2d6()]
}

export default function DevTools({ location, mods, setMods }) {
  let [modalOpen, setModalOpen] = useState(false)
  console.log('mods', mods)

  const modalContent =
    <Container cname="App-main">
      <Container>
        <p>Siema</p>
        <Button cname="Button-small" callback={toggleModal}>Nara</Button>
      </Container>
      <Container cname="Inventory-outer CenterFlex">
        <Container cname="Inventory-inner">
          <Item item={testItem} mods={mods} setMods={setMods}></Item>
        </Container>
      </Container>
    </Container>;

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
  )
}
