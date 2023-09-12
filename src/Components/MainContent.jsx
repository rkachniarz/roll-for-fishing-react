import { playGame } from "../Functions/game";
import { Button } from "./Button";
import { Container } from "./Container";
import { EventLog } from "./Eventlog";
import { PlayerInfo } from "./PlayerInfo";




export function MainContent({ location, player, logs=[] }) {
    
let classIngame= (player ? "-ingame" : "");
function buttonFunction(){
    playGame(location,player);
}

    if (player) {
        return (
            <Container cname={`App-main${classIngame}`}>
                <PlayerInfo player={player} />
                <Button cname="Button-big Button-MainButton" callback={buttonFunction}>Roll!</Button>
                < br/>
                <Button cname="Button-small">Show History</Button>
                <Button cname="Button-small">Inventory</Button>
                <EventLog>{logs}</EventLog>
            </Container>
        );
    }
    else return (
        <Container cname="App-main">
            <Button cname="Button-big">Create character</Button>
            <br />
            <Button cname="Button-big">Random character</Button>
        </Container>
    );
}
