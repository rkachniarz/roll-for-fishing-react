import clsx from 'clsx';

export default function Container({ cname, children }) {
  let classes = clsx(cname, { "empty": !children || children.length < 1 }, {"Container-default": typeof cname === 'undefined'});
  return <div className={classes}>{children}</div>;
}
