


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
  title: "The Cave",
  description: "You enter a dark cave. It is very dark and you can barely see anything. You hear a noise in the distance.",
  options: [
    {
      title: "Investigate",
      description: "You walk towards the noise. It is getting louder and louder. You can see a light in the distance.",
      nextSlide: 1
    },
    {
      title: "Leave",
      description: "You decide to leave the cave. You are too scared to continue.",
      nextSlide: 2
    }
  ],
  slides: [
    {
      title: "The Light",
      description: "You walk towards the light. It is getting brighter and brighter. You can see a treasure chest.",
      options: [
        {
          title: "Open the chest",
          description: "You open the chest and find a sword",
          changeStats: {
            xp: 10,
            health: 10
          }
        },
        {
          title: "Leave",
          description: "You decide to leave the chest alone.",
          changeStats: {
            xp: -10,
            health: -10
          }
        }
      ]
    },
    {
      title: "The Exit",
      description: "You walk towards the exit. It is getting closer and closer. You can see the light.",
      options: [
        {
          title: "Leave",
          description: "You leave the cave.",
          changeStats: {
            xp: 0,
            health: 0
          }
        }
      ]
    }
  ]
}
