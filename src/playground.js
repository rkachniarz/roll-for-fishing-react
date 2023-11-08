import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Container } from './Components/Container';
import { Button } from './Components/Button';

function popModal(){console.log('this is gonna do things')}

const root = ReactDOM.createRoot(document.getElementById('playground_root'));
root.render(
    <Container> 
        <Button cname="Button-big" callback={popModal}></Button>
    </Container>
);