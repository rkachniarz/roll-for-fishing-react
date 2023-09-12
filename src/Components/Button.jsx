
function f(){console.error("Button was clicked, but it has no callback")};

export function Button({cname, callback=f, children}) {
    return(
        <button className={cname} onClick={callback}>{children}</button>
    )
}


