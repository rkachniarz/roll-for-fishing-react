function f() {
  console.error('Button was clicked, but it has no callback');
}

export function Button({ cname, callback = f, disabled, children }) {
  return (
    <button disabled={disabled} className={cname} onClick={callback}>
      {children}
    </button>
  );
}
