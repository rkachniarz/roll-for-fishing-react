import { Player, classes } from './player.js';
import { year } from '../Data/weather.js';

const SAVE_KEY = 'rollForFishing_save';

export function saveGame(player, currentSeason, currentWeather, seasonDay) {
  const save = {
    player: {
      name: player.name,
      classIndex: classes.indexOf(player.class),
      skill: player.skill,
      treasureFind: player.treasureFind,
      fishFind: player.fishFind,
      totalxp: player.totalxp,
      level: player.level,
      totalCasts: player.totalCasts,
      inventory: player.inventory,
      fishHistory: player.fishHistory,
    },
    world: {
      seasonIndex: year.indexOf(currentSeason),
      weatherIndex: currentSeason.weathers.indexOf(currentWeather),
      seasonDay,
    },
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function restorePlayer(savedPlayer) {
  const player = new Player();
  player.restore({
    name: savedPlayer.name,
    playerClass: classes[savedPlayer.classIndex],
    skill: savedPlayer.skill,
    treasureFind: savedPlayer.treasureFind,
    fishFind: savedPlayer.fishFind,
    totalxp: savedPlayer.totalxp,
    level: savedPlayer.level,
    totalCasts: savedPlayer.totalCasts,
    inventory: savedPlayer.inventory,
    fishHistory: savedPlayer.fishHistory,
  });
  return player;
}
