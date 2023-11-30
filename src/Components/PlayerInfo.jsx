import Container from './Container';
import ModStat from './ModStat';

export default function PlayerInfo({ player, mods }) {

  let junkTotalWorth = player.junkPile.reduce((total, junk) => total + junk.value, 0);

  function displayPlayerVantage() {
    if (mods.playerVantage < 0) return "Disadvantage";
    else return "Advantage";
  }

  return (
    <Container cname="PlayerInfo">
      <Container cname="PlayerStat">{`${player.name}, level ${player.level} ${player.class.name}`}</Container>
      <Container cname="PlayerStat">{`${player.totalxp} XP`}</Container>
      <Container cname="PlayerStat">
        {`Fishing bonus: ${player.skill}`}
        <ModStat stat={playerSkillMod} mods={mods} />
      </Container>

      {(mods.playerVantage != 0) && <Container cname="PlayerStat">{`${displayPlayerVantage()} on fishing rolls`}</Container>}

      <Container cname="PlayerStat">
        {`Fish Find: ${player.fishFind}`}
        <ModStat stat={playerFishFindMod} />
      </Container>

      <Container cname="PlayerStat">
        {`Treasure find: ${player.treasureFind}`}
        <ModStat stat={playerTreasureFindMod} mods={mods} />
      </Container>

      <br />

      {(junkTotalWorth > 0) && <Container cname="PlayerStat">{`Junk value: ${junkTotalWorth} copper`}</Container>}

    </Container>
  );
}


// playerVantage: 0,
// playerSkillMod: 0,
// playerFishFindMod: 0,
// playerTreasureFindMod: 0,
