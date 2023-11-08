import Container from './Container';

export default function PlayerInfo({ player }) {
  return (
    <Container cname="PlayerInfo">
      <Container cname="PlayerStat">{`${player.name}, level ${player.level} ${player.class.name}`}</Container>
      <Container cname="PlayerStat">{`${player.totalxp} XP`}</Container>
      <Container cname="PlayerStat">{`Fishing bonus: ${player.skill}`}</Container>
      <Container cname="PlayerStat">{`Fish Find: ${player.fishFind}`}</Container>
      <Container cname="PlayerStat">{`Treasure find: ${player.treasureFind}`}</Container>
    </Container>
  );
}
