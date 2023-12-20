export default function ModStat({ stat }) {

  function displayModStat(value) {
    return `${Math.abs(value)}`;
  }

  function displayModSign(value) {
    if (value === 0) return;
    else return `${value > 0 ? ' + ' : ' - '}`;
  }

  let className = stat > 0 ? 'ModStat' : 'ModStat-negative';

  return (

    <>
      {(stat != 0) &&
        <>
          {displayModSign(stat)}
          <span className={className}>
            {displayModStat(stat)}
          </span>
        </>}
    </>

  );

}
