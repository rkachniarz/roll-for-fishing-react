import React from 'react';
//Styles
import './App.css';
//Components
import Container from './Components/Container.jsx';
import Footer from './Components/Footer.jsx';
import Header from './Components/Header.jsx';
import MainContent from './Components/MainContent.jsx';
import { lake } from './Data/locations.js';
import { useState } from 'react';
import { loadGame, restorePlayer } from './Functions/storage.js';
//Flags/Debug
let locationFlag = lake;

function App() {
  const save = loadGame();
  const initialPlayer = save ? restorePlayer(save.player) : '';
  let [currentLocation, setCurrentLocation] = useState(locationFlag);
  let [currentPlayer, setCurrentPlayer] = useState(initialPlayer);

  return (
    <Container cname="App-main-container">
      <Header player={currentPlayer}></Header>
      <MainContent
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
        currentPlayer={currentPlayer}
        setCurrentPlayer={setCurrentPlayer}
      />
      <Footer></Footer>
    </Container>
  );
}

export default App;
