//randomness
export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function roll20(vantage = 0) {
  const firstroll = getRandomNumber(1, 20);
  if (vantage === 0) return firstroll;
  const secondroll = getRandomNumber(1, 20);
  if (vantage < 0) return Math.min(firstroll, secondroll);
  else return Math.max(firstroll, secondroll);
}

export function roll100() {
  return getRandomNumber(1, 100);
}

export function pickRandom(objectArray) {
  var filler = 100 - objectArray.map((r) => r.chance).reduce((sum, current) => sum + current);
  if (filler <= 0) {
    console.error('Chances sum is higher than 100 in: ', objectArray);
    return;
  }
  var probability = objectArray
    .map((r, i) => Array(r.chance === 0 ? filler : r.chance).fill(i))
    .reduce((c, v) => c.concat(v), []);
  var pIndex = Math.floor(Math.random() * 100);
  var pickedObject = objectArray[probability[pIndex]];
  return pickedObject;
}

export function pickFromArray(array) {
  if (array.length === 0) return [];
  else return array[getRandomNumber(0, array.length - 1)];
}

//type-specific operations

export function removeElement(array, elementToRemove) {
  const newArray = array.filter((element) => !(element === elementToRemove));
  return newArray;
}

export function mergeArrays(array1, array2) {
  return array1.concat(array2);
}

export function unmergeArray(parent, child) {
  return parent.filter((x) => !child.includes(x));
}

export function isEmpty(objOrArray) {
  return Object.keys(objOrArray).length === 0;
}

//written but unused

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function xor(a, b) {
  return a ? !b : b;
}
