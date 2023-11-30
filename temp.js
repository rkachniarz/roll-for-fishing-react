let event = {
  uid: 0,
  title: '',
  slides: [
    (simpleABevent = {
      slideTitle: 'Make a choice',
      slideText: (
        <RichText>
          {' '}
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

function Popup() {
  let classes = clsx();
  return <Container cname={classes}></Container>;
}

function DisplayEventPopup(event) {
  return <Popup>{displayEventSlides()}</Popup>;
}

emptyEvent = { slideTitle: '', slideText: <RichText />, slideChoices: [] };

simpleABevent = {
  slideTitle: 'Make a choice',
  slideText: (
    <RichText>
      {' '}
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
};
