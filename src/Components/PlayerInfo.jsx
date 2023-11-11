import Container from './Container';

export default function PlayerInfo({ player }) {

  let junkTotalWorth = player.junkPile.reduce((total, junk) => total + junk.value, 0);

  return (
    <Container cname="PlayerInfo">
      <Container cname="PlayerStat">{`${player.name}, level ${player.level} ${player.class.name}`}</Container>
      <Container cname="PlayerStat">{`${player.totalxp} XP`}</Container>
      <Container cname="PlayerStat">{`Fishing bonus: ${player.skill}`}</Container>
      <Container cname="PlayerStat">{`Fish Find: ${player.fishFind}`}</Container>
      <Container cname="PlayerStat">{`Treasure find: ${player.treasureFind}`}</Container>
      {(junkTotalWorth > 0) && <Container cname="PlayerStat">{`Junk value: ${junkTotalWorth} copper`}</Container>}
    </Container>
  );
}
