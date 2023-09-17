import clsx from 'clsx';

export function Container({ cname, children }) {
  let classes = clsx(cname, { "empty": !children || children.length < 1 });
  return <div className={classes}>{children}</div>;
}
