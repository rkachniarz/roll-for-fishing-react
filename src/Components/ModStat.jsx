export default function ModStat(stat, mods) {

  function displayModStat(mod) {
    console.log('displayModStat was called')
    return `${Math.abs(mod)}`;
  }

  function displayModSign(mod) {
    console.log('displayModSign was called')
    return `${mod > 0 ? ' + ' : ' - '}`;
  }

  return (
    <>
      {(mods[stat] != 0 && (Number(mods[stat]) === true)) &&
        <>
          {displayModSign(mods[stat])}
          <span className="ModStat">
            {displayModStat(mods[stat])}
          </span>
        </>}
    </>

  );

}
