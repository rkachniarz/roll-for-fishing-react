import { useState } from "react"
import { generateName } from "../Functions/player";
import { classes } from "../Functions/player";
import Container from "./Container";
import Button from "./Button";


export default function PlayerCreator(){


  const [playerName, setPlayerName] = useState(generateName());
  const [playerClass, setPlayerClass] = useState();
  const [cheat, setCheat] = useState('');
  const [futurePlayer, setFuturePlayer] = useState([]);

function ClassesRadio(classList){
  return classes.map((pClass, index)=>
    <div key={pClass.id}>
      <input
        type="radio"
        id={`playerClass-${index}`}
        checked={playerClass===pClass.id}
        name="playerClass"
        value={pClass.id}
        onChange={e=> {setPlayerClass(pClass.id)}}
      />
      <label htmlFor={`playerClass-${index}`}>{pClass.name}</label>
    </div>)
}

function handleSubmit(e){
  e.preventDefault();
  console.log(setFuturePlayer([playerName, playerClass, cheat]));
  console.log(playerName, playerClass);
  console.log(futurePlayer);
}

function generateNewName(e){
  e.preventDefault();
  setPlayerName(generateName());
}

  return(
    <Container cname="LeftFlex">
    <form>
      <div>
        <label htmlFor="playerName">Name: </label>
        <input type="text" id="playerName" name="playerName" value={playerName} onChange={e=>setPlayerName(e.target.value)}/>
        <Button cname="Button-tiny-reroll" callback={generateNewName}>🎲</Button>
      </div>
      <div>
        <div>
          <label htmlFor="playerClass">Class:</label>
        </div>
        <div>
          <ClassesRadio classList={classes}/>
        </div>
      </div>
      <div>
        <label htmlFor="cheat">Cheats? </label>
        <input type="password" id="cheat" name="cheat" value={cheat} onChange={e=>setCheat(e.target.value)}/>
      </div>
      <div>
        <input type="submit" value="Create Player" onClick={handleSubmit} />
      </div>
    </form>
    </Container>
  )
}

//name
//class (radio)
//roll stats
//cheat input
