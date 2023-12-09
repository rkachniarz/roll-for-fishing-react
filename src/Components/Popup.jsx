import { isEmpty } from "./src/Functions/helpers";
import Button from "./src/Components/Button";
import Container from "./src/Components/Container";

let emptyEvent = { type: event, slideTitle: '', slideText: <RichText />, slideChoices: [] };
let event = {
  type: 'event',
  uid: 0,
  title: '',
  slides: [
    (simpleABevent = {
      slideTitle: 'Make a choice',
      slideText: (
        <RichText>
          You are being asked to make a choice. <br /> Make it.
        </RichText>
      ),
      slideChoices: [
        {
          buttonText: 'The first choice',
          buttonCallback: () => console.log('The first choice was made'),
        },
        {
          buttonText: 'The second choice',
          buttonCallback: () => console.log('The second choice was made'),
        },
      ],
    }),
  ],
};
let levelUpContent = {
  type: 'levelup',
  title: 'Level up!',
  text: 'Choose your reward',
  firstChoice: {
     buttonText: 'The first choice',
     buttonCallback: () => console.log('The first choice was made')
    },
  secondChoice:         {
    buttonText: 'The second choice',
    buttonCallback: () => console.log('The second choice was made'),
  }
}

function Popup({content, setPopupContent, player}) {
  let classes = clsx({ "Popup-empty": isEmpty(content) }, {"Popup-levelup": content.type === 'levelup'}, {"Popup-event": content.type === 'event'});

  function handleButtonClick(callback){
    setPopupContent([]);
    callback();
  }
  //determine what type of content needs to be displayed
  //based on that, display content
  //there's always at least one button at the bottom
  //clicking the button changes/closes the popup as needed
  //popup-related stuff must be separate from received data, except for type
  if (content.type === 'event') return <Container cname={classes}></Container>;
  if (content.type === 'levelup') return (
  <Container cname={classes}>
      <p>{content.title}</p>
      <p>{content.text}</p>
      <Button cname='Button-perk' callback={()=>handleButtonClick(content.firstChoice.buttonCallback)}>{content.firstChoice.buttonText}</Button>
      <Button cname='Button-perk' callback={()=>handleButtonClick(content.secondChoice.buttonCallback)}>{content.secondChoice.buttonText}</Button>
  </Container>
  )
}

function DisplayEventPopup(event) {
  return <Popup>{displayEventSlides()}</Popup>;
}

let renderLevelUp= <Container>

</Container>
