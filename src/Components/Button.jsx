import clsx from "clsx";

function f() {
  console.error('Button was clicked, but it has no callback');
}

export default function Button({ cname, callback = f, disabled, children }) {
  const classes=clsx('Button', cname);

  return (
    <button type='button' disabled={disabled} className={classes} onClick={callback}>
      {children}
    </button>
  );
}
