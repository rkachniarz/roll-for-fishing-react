// {
//     uid: 0,
//     name: '',
//     description: '',
//     flavor: '',
//     mechanics: {},
//     active: true
// }
const possibleParameters = {
playerAdvantage: false,
playerDisadvantage: false,
playerSkillMod: 0,
playerFishFindMod: 0,
playerTreasureFindMod: 0,
fishAdvantage: false,
fishDisadvantage: false,
fishDifficultyMod: 0,
fishSizeModArray: [],
extraMainButtonCallbacks: []
}

export const itempool = [
    {
    uid: 0,
    name: '',
    description: '',
    flavor: '',
    mechanics: {},
    active: true
  },  
  {
    uid: 1,
    name: 'Mega Mass Fish Chum',
    icon: "🗃",
    description: 'Fish can grow more beefy',
    flavor: 'Dad, should trout have biceps this huge?',
    mechanics: {fishSizeModArray: [{ name: 'Mega Massive', chance: 5, difficultyMod: 8 }, { name: 'Swole AF', chance: 2, difficultyMod: 10 }]},
    active: true
  },
  
  {
    uid: 2,
    name: 'Fishing pole laser sight',
    icon: "🔴",
    description: '+2 fishing skill. -2 treasure find.',
    flavor: 'Now if only you could shoot at them...',
    mechanics: {playerSkillMod: 2},
    active: true
  },
  {
    uid: 3,
    name: 'Heavy bait',
    icon: "🎱",
    description: '+5 fishing skill. Disadvantage on fishing rolls.',
    flavor: "If you manage to hit 'em, they ain't got no chance ",
    mechanics: {playerDisadvantage: true, playerSkillMod: 5},
    active: true
  },
  {
    uid: 4,
    name: "Industrial-strength gelatin",
    icon: "🧊",
    description: "Fish get disadvantage. They are also harder to find.",
    flavor: "In waterproof packaging.",
    mechanics: {fishDisadvantage: true, playerFishFindMod: -5},
    active: true
  }
  ]

let item=
{
    uid: 0,
    name: '',
    description: '',
    flavor: '',
    mechanics: {},
    active: true
}