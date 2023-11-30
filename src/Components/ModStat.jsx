export default function ModStat(stat, mods) {

  function displayModStat(mod) {
    return `${Math.abs(mod)}`;
  }

  function displayModSign(mod) {
    return `${mod > 0 ? ' + ' : ' - '}`;
  }

  return (
    <>
      {(mods[modstat] != 0) &&
        <>
          {displayModSign(mods[stat])}
          <span className="ModStat">
            {displayModStat(mods[stat])}
          </span>
        </>}
    </>

  );

}
