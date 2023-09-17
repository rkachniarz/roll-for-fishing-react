//Styles
import './App.css';
//Components
import { Container } from './Components/Container';
import { Footer } from './Components/Footer';
import { Header } from './Components/Header';
import { MainContent } from './Components/MainContent';
//Functions
import { useState } from 'react';
import { Player } from './Functions/player.js';
import { getRandomNumber, roll20 } from './Functions/helpers.js';
import './Data/locations.js';
import { lake } from './Data/locations.js';
//Variables
let player = new Player('Guy', getRandomNumber(0, 2));


const currentLocation = lake;
const currentPlayer = player;
//

function App() {
  return (
    <Container>
      <Header player={currentPlayer}></Header>
      <MainContent location={currentLocation} player={currentPlayer} logs={[]}></MainContent>
      <Footer></Footer>
    </Container>
  );
}

export default App;

