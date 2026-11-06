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
  'value.vantageStacks': 'advantage that stacks',
  'value.naturalCatch': 'lowest natural roll that always lands a fish',
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
  'value.eventMeterFill': 'chance of events',
  'value.bucketSize': 'bucket size',
  'value.baitRecovery': 'chance to save bait',
  'value.baitEscapeLoss': 'chance to lose bait to an escaping fish',

  // ---- Effects in tooltips (R8.6) ----
  'effect.amount': '{amount} {value}',
  'effect.advantage': 'Advantage on your roll',
  'effect.strongAdvantage': 'Strong advantage on your roll',
  'effect.disadvantage': 'Disadvantage on your roll',
  'effect.strongDisadvantage': 'Strong disadvantage on your roll',
  'effect.fishAdvantage': "Advantage on the fish's roll",
  'effect.fishStrongAdvantage': "Strong advantage on the fish's roll",
  'effect.fishDisadvantage': "Disadvantage on the fish's roll",
  'effect.fishStrongDisadvantage': "Strong disadvantage on the fish's roll",
  'effect.vantageStacks': 'Every source of advantage adds a die, and the best counts',
  'effect.naturalCatch': 'A natural {from} or higher lands the fish',
  'effect.cosmetic': 'Changes how your bobber looks.',

  // ---- The buff bar ----
  'buff.cancelHint': 'right-click or long-press to cancel',

  // ---- The status line ----
  'status.idle': 'Tap the water to cast.',
  'status.waiting': 'Watch the bobber…',
  'status.bite': 'Splash! Strike now!',
  'status.done': 'Tap to cast again.',
  'status.pause': 'The bobber bobs back up…',

  // ---- The strike, floating over the bobber (D82); the roll, in the log ----
  'float.fast': 'Fast strike!',
  'float.ok': 'Strike!',
  'float.bad': 'Slow strike',
  'float.early': 'Too early!',
  'float.wild': 'Way off!',
  'log.roll': 'd20: {roll}{mods} = {total}, needed {needed}.',
  'log.natural20': ' Natural 20!',
  'log.critical': ' Critical!',

  // ---- The log ----
  'log.caught': 'You caught: {fish} ({size} cm). +{xp} XP.',
  'log.seenBefore': "You've seen this one before.",
  'log.escaped': 'The {fish} got away!',
  'log.missed': 'Too slow: the {fish} got away.',
  'log.missedSomething': 'Too slow: whatever it was is gone.',
  'log.too-early': 'Too early! You pulled the line out.',
  'log.found': 'You caught: {item}',
  'log.empty': 'Your hook comes up empty.',
  'log.bait-saved': 'Your {bait} was saved.',
  'log.bait-eaten': 'The {fish} has eaten your {bait}.',
  'log.bait-lost': 'The {fish} got away with your {bait}.',
  'log.reeled-in': 'You reel the line in.',
  'log.recast': 'The bobber settles. The line is out again.',
  'log.level-up': 'Level up! You are now level {level}.',
  'log.perk': 'You learn {perk}.',
  'log.perk-owed': 'You can choose a new perk.',
  'log.weather': '{description}',
  'log.season': 'It is now {season}. {description}',
  'log.buff-ended': '{buff} has worn off.',
  'log.bucket-full': 'Your bucket is full. Choose a fish to let go.',
  'log.released': 'You let the {fish} go.',
  'log.event-gained': 'You receive: {item}',
  'log.event-lost': 'You lose: {item}',
  'log.event-xp': 'You gain {xp} XP.',

  // ---- A full bucket (D59) ----
  'release.title': 'Your bucket is full',
  'release.text': 'Let one fish go to make room. It goes back into the water here, and you may meet it again.',
  'release.new': 'Just caught',
  'release.fish': '{fish}, {size} cm',
  'log.feature-appeared': '{Feature} appears.',
  'log.feature-hit': 'Your bobber lands in {feature}.',
  'log.feature-gone': '{Feature} is gone.',
  'log.feature-moved': '{Feature} swims off somewhere else.',

  // ---- The button row and the time (R16.4) ----
  'hud.player': 'Character',
  'hud.weather': 'Weather',
  'hud.journal': 'Journal',
  'hud.map': 'Map',
  'hud.bucket': 'Bucket',
  'hud.bag': 'Bag',
  'hud.menu': 'Menu',
  'hud.close': 'Close',
  'hud.xp': '{xp} / {next} XP',
  'hud.seasonDay': '{season}, day {day}',
  'time.night': 'Night',
  'time.dawn': 'Dawn',
  'time.morning': 'Morning',
  'time.noon': 'Noon',
  'time.afternoon': 'Afternoon',
  'time.sunset': 'Sunset',
  'time.evening': 'Evening',

  // ---- The panes ----
  'player.level': 'Level {level} {className}',
  'player.xp': '{xp} / {next} XP',
  'player.maxLevel': '{xp} XP, the highest level',
  'player.stats': 'Stats',
  'player.equipment': 'Equipment',
  'slot.rod': 'Rod',
  'slot.line': 'Line',
  'slot.bobber': 'Bobber',
  'slot.bait': 'Bait',
  'slot.hat': 'Hat',
  'slot.trinket': 'Trinket',
  'slot.trinket1': 'Trinket',
  'slot.trinket2': 'Trinket',
  'slot.none': 'Empty',

  // ---- Errors, in red over the scene, as WoW's (D83) ----
  'error.noRod': 'Must have a fishing pole equipped.',
  'error.wrongSlot': "That item doesn't go in that slot.",
  'error.notEquippable': "That item can't be equipped.",
  'error.busy': "You can't change equipment while the line is out.",
  'journal.casts': 'Casts',
  'journal.catches': 'Fish caught',
  'journal.fish': 'Fish',
  'journal.entry': '{caught} caught, {smallest}–{largest} cm, average {average} cm',
  'journal.none': 'Nothing caught yet.',
  'map.shore': 'The shore',
  'map.later': 'Other spots, other waters and the town come later.',
  'bucket.count': '{count} of {size} fish',
  'bag.equipment': 'Equipment',
  'bag.consumables': 'Consumables',
  'bag.stuff': 'Stuff',
  'menu.mainMenu': 'Main menu',
  'menu.settings': 'Settings',
  'menu.dev': 'Dev bench',
  'settings.theme': 'Theme',
  'settings.dark': 'Dark',
  'settings.light': 'Light',

  // ---- The title screen (D80) ----
  'title.name': 'Roll for Fishing',
  'title.continue': 'Continue',
  'title.new': 'New game',
  'title.load': 'Load game',
  'title.back': 'Back',
  'title.pickNew': 'Which slot for the new game?',
  'title.pickLoad': 'Which game?',
  'title.slot': 'Slot {slot}',
  'title.empty': 'Empty',
  'title.game': '{name}, level {level} {className} · {season}, day {day}',
  'title.broken': "Can't be read: {error}",
  'title.overwrite': 'Slot {slot} holds {name}. Start a new game there? {name} will be lost for good.',
  'title.overwriteBroken': "Slot {slot} can't be read. Start a new game there? What's in it will be lost.",

  // ---- Tooltips ----
  'tip.fish': 'Fish',
  'tip.size': '{size} cm',
  'tip.unique': 'Unique',
  'tip.consumable': 'Consumable',

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

/**
 * t() in pieces, so a placeholder can be filled with something other than
 * text: a link in the log (R16.5).
 *   tParts('log.found', { item: linkElement }) -> ['You caught: ', linkElement]
 * @template P
 * @param {string} key
 * @param {Record<string, string | number | P>} params
 * @returns {(string | P)[]}
 */
export function tParts(key, params) {
  const text = table[key] ?? key;
  /** @type {(string | P)[]} */
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(/\{(\w+)\}/g)) {
    parts.push(text.slice(last, m.index));
    const value = m[1] in params ? params[m[1]] : m[0];
    parts.push(typeof value === 'number' ? String(value) : value);
    last = /** @type {number} */ (m.index) + m[0].length;
  }
  parts.push(text.slice(last));
  // Neighbouring text joins up, so only the links stand apart.
  /** @type {(string | P)[]} */
  const joined = [];
  for (const p of parts) {
    if (p === '') continue;
    const prev = joined.length - 1;
    if (typeof p === 'string' && typeof joined[prev] === 'string') joined[prev] += p;
    else joined.push(p);
  }
  return joined;
}
