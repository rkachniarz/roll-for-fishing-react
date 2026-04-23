import Modal from './Modal';
import Button from './Button';
import Container from './Container';

function buildSpeciesRecords(fishHistory) {
  const map = {};
  for (const record of fishHistory) {
    if (!map[record.name]) {
      map[record.name] = { count: 0, smallest: record, largest: record, totalSize: 0 };
    }
    const entry = map[record.name];
    entry.count++;
    entry.totalSize += record.numericSize;
    if (record.numericSize < entry.smallest.numericSize) entry.smallest = record;
    if (record.numericSize > entry.largest.numericSize) entry.largest = record;
  }
  return map;
}

export default function RecordBook({ player, active, onClose }) {
  const { fishHistory, totalCasts } = player;
  const caught = fishHistory.length;
  const catchRate = totalCasts > 0 ? ((caught / totalCasts) * 100).toFixed(1) : '0.0';
  const speciesRecords = buildSpeciesRecords(fishHistory);

  return (
    <Modal cname="RecordBook" active={active}>
      <Container cname="RecordBook-header">
        <span>📖 Record Book</span>
        <Button cname="Button-small" callback={onClose}>
          Close
        </Button>
      </Container>

      <Container cname="RecordBook-summary">
        <span>
          Total casts: <strong>{totalCasts}</strong>
        </span>
        <span>
          Fish caught: <strong>{caught}</strong>
        </span>
        <span>
          Catch rate: <strong>{catchRate}%</strong>
        </span>
      </Container>

      {caught === 0 ? (
        <p className="RecordBook-empty">No fish caught yet. Get casting!</p>
      ) : (
        <table className="RecordBook-table">
          <thead>
            <tr>
              <th>Species</th>
              <th>Caught</th>
              <th>Smallest</th>
              <th>Largest</th>
              <th>Avg size</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(speciesRecords).map(([name, data]) => {
              const avg = (data.totalSize / data.count).toFixed(1);
              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{data.count}</td>
                  <td>
                    {data.smallest.numericSize}cm ({data.smallest.size})
                  </td>
                  <td>
                    {data.largest.numericSize}cm ({data.largest.size})
                  </td>
                  <td>{avg}cm</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
