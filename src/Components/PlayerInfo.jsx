import Container from './Container';

export default function PlayerInfo({ player, mods }) {

  let junkTotalWorth = player.junkPile.reduce((total, junk) => total + junk.value, 0);

  function displayModStat(mod) {
    return `${Math.abs(mod)}`
  }


  function displayModSign(mod) {
    return `${mod > 0 ? ' + ' : ' - '}`
  }

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
        {
          (mods.playerSkillMod != 0) &&
          <span>
            {displayModSign(mods.playerSkillMod)}
            <span className="ModStat">
              {displayModStat(mods.playerSkillMod)}
            </span>
          </span>
        }
      </Container>
      {(mods.playerVantage != 0) && <Container cname="PlayerStat">{`${displayPlayerVantage()} on fishing rolls`}</Container>}
      <Container cname="PlayerStat">
        {`Fish Find: ${player.fishFind}`}
        {
          (mods.playerFishFindMod != 0) &&
          <span>
            {displayModSign(mods.playerFishFindMod)}
            <span className="ModStat">
              {displayModStat(mods.playerFishFindMod)}
            </span>
          </span>
        }
      </Container>
      <Container cname="PlayerStat">
        {`Treasure find: ${player.treasureFind}`}
        {
          (mods.playerTreasureFindMod != 0) &&
          <span>
            {displayModSign(mods.playerTreasureFindMod)}
            <span className="ModStat">
              {displayModStat(mods.playerTreasureFindMod)}
            </span>
          </span>
        }
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
