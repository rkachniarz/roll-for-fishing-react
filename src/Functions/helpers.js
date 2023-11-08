export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function roll20(advantage = false) {
  const firstroll = getRandomNumber(1, 20);
  const secondroll = getRandomNumber(1, 20);

  return advantage ? Math.max(firstroll, secondroll) : firstroll;
}

export function roll100() {
  return getRandomNumber(1,100)
}

export function pickRandom(objectArray) {
  var filler = 100 - objectArray.map((r) => r.chance).reduce((sum, current) => sum + current);
  if (filler <= 0) {
    console.error('Sum of chances is higher than 100!');
    return;
  }
  var probability = objectArray
    .map((r, i) => Array(r.chance === 0 ? filler : r.chance).fill(i))
    .reduce((c, v) => c.concat(v), []);
  var pIndex = Math.floor(Math.random() * 100);
  var pickedObject = objectArray[probability[pIndex]];
  return pickedObject;
}
