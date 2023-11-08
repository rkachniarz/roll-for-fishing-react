import clsx from 'clsx';

export default function Modal ({cname, children, active=false}) {

    
    if (!active) return;

    let classes = clsx(cname, {"Modal":true})

    return(
        <div className={classes}>
            {children}
        </div>
    )
}

