// @ts-check
// Every piece of player-facing text is read through t() (docs/decisions.md,
// D46). Content text is written in English in content/ and collected into a
// table by `npm run content`; a translation would be one more table.
//
//   t(fish.name)                          -> 'Pike'  (content holds the key, 'fish.pike.name')
//   t('log.found', { item: 'Bent fork' }) -> 'You found: Bent fork.'

import { strings } from './generated/content.js';

/** The game's own text, outside content. */
const UI_STRINGS = {
  // ---- Game values (R6.6) ----
  'value.fishingSkill': 'Fishing Skill',
  'value.fishFind': 'Fish Find',
  'value.treasureFind': 'Treasure Find',
  'value.playerVantage': 'advantage on your roll',
  'value.fishVantage': "advantage on the fish's roll",
  'value.fishDifficulty': 'fish difficulty',
  'value.fishSizeBand': 'fish size',
  'value.fishXp': 'XP per fish',
  'value.castScatter': 'cast scatter',
  'value.biteDelayMin': 'shortest wait for a bite',
  'value.biteDelayMax': 'longest wait for a bite',
  'value.reactionFast': 'time for a fast strike',
  'value.reactionOk': 'time for an ok strike',
  'value.strikeLimit': 'time to strike',
  'value.missPause': 'pause after a missed splash',
  'value.bucketSize': 'bucket size',
  'value.baitRecovery': 'chance to save bait',
  'value.baitEscapeLoss': 'chance to lose bait to an escaping fish',

  // ---- The buff bar ----
  'buff.cancelHint': 'right-click or long-press to cancel',

  // ---- The status line ----
  'status.idle': 'Tap the water to cast.',
  'status.waiting': 'Watch the bobber…',
  'status.bite': 'Splash! Strike now!',
  'status.done': 'Tap to cast again.',
  'status.pause': 'The bobber bobs back up…',

  // ---- The result of a cast ----
  'result.caught': 'Caught it!',
  'result.escaped': 'It got away.',
  'result.landed': 'Got something!',
  'result.empty': 'Nothing on the hook.',
  'result.missed': 'Too slow.',
  'result.too-early': 'Too early!',
  'result.strike': '{grade} strike ({time}).',
  'result.roll': 'd20: {roll}{mods} = {total}, needed {needed}.',
  'result.natural20': ' Natural 20!',
  'grade.fast': 'Fast',
  'grade.ok': 'OK',
  'grade.bad': 'Slow',

  // ---- The log ----
  'log.caught': 'You caught a {fish} ({size} cm)! +{xp} XP.',
  'log.seenBefore': "You've seen this one before.",
  'log.escaped': 'The {fish} got away.',
  'log.missed': 'Too slow: the {fish} got away.',
  'log.missedSomething': 'Too slow: whatever it was is gone.',
  'log.too-early': 'Too early! You pulled the line out.',
  'log.found': 'You found: {item}. {flavor}',
  'log.empty': 'Your hook comes up empty.',
  'log.bait-saved': 'Your {bait} was recovered.',
  'log.bait-eaten': 'The {fish} has eaten your {bait}.',
  'log.bait-lost': 'The {fish} got away with your {bait}.',
  'log.reeled-in': 'You reel the line in.',
  'log.recast': 'The bobber settles. The line is out again.',
  'log.level-up': 'Level up! You are now level {level}.',
  'log.weather': 'The weather changes. {description}',
  'log.season': 'It is now {season}. {description}',
  'log.buff-ended': '{buff} has worn off.',
  'log.bucket-full': 'Your bucket is full. Choose a fish to let go.',
  'log.released': 'You let the {fish} go.',

  // ---- A full bucket (D59) ----
  'release.title': 'Your bucket is full',
  'release.text': 'Let one fish go to make room. It goes back into the water here, and you may meet it again.',
  'release.new': 'Just caught',
  'release.fish': '{fish}, {size} cm',
  'log.feature-appeared': 'On the water: {feature}.',
  'log.feature-hit': 'Your bobber lands in {feature}.',
  'log.feature-gone': '{Feature} is gone.',

  // ---- The panel ----
  'panel.character': '{name}, {className} · level {level} ({xp} XP)',
  'panel.world': '{location} · {season}, day {day}, {clock} · {weather}',
  'panel.newGame': 'New game',
  'panel.bags': 'Bucket & bags',
  'panel.bucket': 'Bucket ({count} fish)',
  'panel.bagsList': 'Bags',
  'panel.equipped': 'Equipped',
  'panel.empty': 'Empty.',
  'panel.fishLine': '{fish}, {size} cm',
  'slot.rod': 'Rod',
  'slot.bait': 'Bait',
  'slot.none': '(none)',
  'panel.confirmNewGame': 'Start a new game? This one will be lost for good.',
  'panel.badSave': "Your saved game couldn't be loaded: {error}. It is still stored; starting a new game will replace it.",

  // ---- Character creation ----
  'create.title': 'A new fisher',
  'create.name': 'Name',
  'create.rerollName': 'Another name',
  'create.gender': 'Gender',
  'create.gender.m': 'Male',
  'create.gender.f': 'Female',
  'create.class': 'Class',
  'create.stats': 'Stats',
  'create.rerollStats': 'Roll again',
  'create.range': '{min}–{max}',
  'create.start': 'Go fishing',
};

const table = { ...strings.en, ...UI_STRINGS };

/**
 * The text for a key, with `{name}` placeholders filled in. A missing key
 * comes back as itself, so a gap shows on screen instead of breaking anything.
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 */
export function t(key, params) {
  const text = table[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole));
}
