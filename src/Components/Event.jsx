


const allRequirements = []
const allEffectCallbacks = []

//requirements: {playerClass: 'rogue'}
function requirementMet({requirementName, requirementValue}){
  return (requirementName === requirementValue)
    //check if player or other object meets requirement
}

function runCallback([functionName, firstParamValue, secondParamValue]){
  functionName(firstParamValue, secondParamValue);
}

function changePlayerStats([statName, statValue]){
  player[statName] += statValue;
}


export default function Event({ event, player, modState }) {
  return (
    <Container>
      <p>{event.title}</p>
      <p>{event.description}</p>
      {event.options.map((option, index) => {



        //each event option is a button
        //some of the options will have a requirement that the player must meet
        //if the player meets the requirement, the button will be shown
        //if the player does not meet the requirement, the button will be hidden
        //some options display another event slide with its own options
        //some options will change the player's stats, including xp
        //some options will change the player's inventory

      })}
    </Container>
  );
}

//event data structure for events with multiple options and slides

let event = {
  title: "A froggy encounter",
  description: "You see a frog in the shallow water, just outside your reach.",
  options: [
    {
      title: "Observe it closely",
      action: 'nextSlide',
      nextSlide: 1
    },
    {
      title: "Ignore it",
      action: 'end',
    },
    {
      title: "Attempt to catch the frog",
      action: 'nextSlide',
      nextSlide: 4,
      requirements: [{  'rogue'}]

    }
  ],
  slides: [
    {
      id: 1,
      description: "You observe the frog. After a moment, a wave of calm washes over you. Everything is going to be alright.",
      options: [
        {
          title: "Thank you, frog",
          action: 'end',
          callbacks: [['changePlayerStats', 'luck', 2]]
        },
      ]
    },
    {
      id: 4,
      description: "You lunge forward and try to catch the amphibian. You get wet, and it's like it was never there.",
      options: [
        {
          title: "Well, shit.",
          action: 'end',
          callbacks: [['changePlayerStats', 'luck', -1]]
        }
      ]
    }
  ]
}
