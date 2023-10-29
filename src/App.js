//Styles
import './App.css';
//Components
import Container from './Components/Container';
import Footer from './Components/Footer';
import Header from './Components/Header';
import MainContent from './Components/MainContent';
import './Data/locations.js';
import { lake } from './Data/locations.js';
import { useState } from 'react';
//Flags/Debug
let playerFlag = '';
//new Player(generateName(), getRandomNumber(0, 2));
let locationFlag = lake;

function App() {
  let [currentLocation, setCurrentLocation] = useState(locationFlag);
  let [currentPlayer, setCurrentPlayer] = useState(playerFlag);

  return (
    <Container cname="App-main-container">
      <Header player={currentPlayer}></Header>
      <MainContent
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
        currentPlayer={currentPlayer}
        setCurrentPlayer={setCurrentPlayer}
      ></MainContent>
      <Footer></Footer>
    </Container>
  );
}

export default App;
