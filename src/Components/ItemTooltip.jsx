import { isEmpty } from '../Functions/helpers';

export default function ItemTooltip({ tooltip }) {
  if (isEmpty(tooltip)) return null;

  const { item, x, y } = tooltip;

  return (
    <div className="ItemTooltip" style={{ left: x, top: y }}>
      <p className="ItemName">{item.name}</p>
      {item.description && <p className="ItemDescription">{item.description}</p>}
      {item.flavor && <p className="ItemFlavor">{item.flavor}</p>}
      {item.active !== undefined && (
        <p className="ItemTooltip-action">Click to {item.active ? 'deactivate' : 'activate'}</p>
      )}
    </div>
  );
}
