// @ts-check
// Item and fish icons, 32×32 (D98; the first ones were drawn at 16 and are
// shown doubled until redrawn), written as code like the scene's sprites
// (docs/decisions.md, D9). Every kind has a default icon, used by anything
// whose own art doesn't exist yet (docs/spec.md, R15.5). Content names an icon
// with its `icon` field; an unknown name falls back to the default too.

import { content } from '../generated/content.js';

/** The icons' own colours. */
export const KEYS = {
  k: '#1b2b34', // outline
  G: '#7fb3c9', // fish
  g: '#d7e8ee', // fish belly
  w: '#ffffff',
  B: '#7a5236', // boot leather
  b: '#4e3322', // boot sole
  W: '#9a6233', // chest wood
  y: '#f2c94c', // gold
  c: '#b58a5a', // cork
  P: '#d05bd6', // potion
  p: '#9b3aa3', // potion, shaded
  // The button row (R16.4), in the owner's sketch's colours.
  V: '#c9b8ea', // book cover
  v: '#9a55b8', // book spine
  M: '#f6ecbf', // map parchment
  m: '#e2c46a', // map edge
  T: '#2f9e4f', // trees
  L: '#8fd3ef', // water
  R: '#e0393b', // map marker
  I: '#b9bec2', // bucket
  i: '#8c9296', // bucket, shaded
  A: '#d9a07e', // bag leather
  a: '#b57a58', // bag leather, shaded
  // Weather: no dark outlines, since these sit on the dark page.
  Y: '#ffe23d', // sun
  O: '#f1edcf', // moon
  C: '#eef3f6', // cloud
  D: '#b3c0c8', // cloud, shaded
  E: '#7b8992', // rain cloud
  r: '#5bb4ff', // rain
};

/** @type {Record<string, string[]>} */
export const ICONS = {
  'default/fish': [
    '......kkkk......',
    '....kkGGGGkk..kk',
    '...kGGGGGGGGkkGk',
    '..kGwkGGGGGGGkGk',
    '.kGGkkGGGGGGGGGk',
    '.kGGGGGGGGGGGGk.',
    '..kggggggggggkGk',
    '...kkggggggkk.kk',
    '.....kkkkkk.....',
  ],
  'default/junk': [
    '....kkkkkk......',
    '....kBBBBk......',
    '....kBBBBk......',
    '....kBBBBk......',
    '....kBBBBk......',
    '....kBBBBkkkk...',
    '...kBBBBBBBBBk..',
    '...kBBBBBBBBBBk.',
    '...kbbbbbbbbbbk.',
    '...kkkkkkkkkkkk.',
  ],
  'default/treasure': [
    '...kkkkkkkkkk...',
    '..kWWWWWWWWWWk..',
    '..kWWWWWWWWWWk..',
    '..kkkkkkkkkkkk..',
    '..kWWWWyyWWWWk..',
    '..kWWWWyyWWWWk..',
    '..kWWWWWWWWWWk..',
    '..kWWWWWWWWWWk..',
    '..kkkkkkkkkkkk..',
  ],
  'default/consumable': [
    '......kkkk......',
    '......kcck......',
    '.......kk.......',
    '......kPPk......',
    '.....kPPPPk.....',
    '....kPPPPPPk....',
    '....kPwPPPPk....',
    '....kPwPPPPk....',
    '....kPPPPPPk....',
    '....kppppppk....',
    '.....kkkkkk.....',
  ],
};

const CLOUD = [
  '.....CCCC.......',
  '....CCCCCC.CC...',
  '..CCCCCCCCCCCC..',
  '.CCCCCCCCCCCCCC.',
  '.CCCCCCCCCCCCCC.',
  '..DDDDDDDDDDDD..',
];
const RAIN_CLOUD = CLOUD.map((row) => row.replace(/D/g, 'E').replace(/C/g, 'D'));
const PARTLY = [
  '..........Y.....',
  '.......Y..Y..Y..',
  '........YYYYY...',
  '.......YYYYYYY..',
  '....CCCCYYYYYYYY',
  '...CCCCCCYYYYY..',
  '.CCCCCCCCCCYYY..',
  'CCCCCCCCCCCCC...',
  'CCCCCCCCCCCCC...',
  '.DDDDDDDDDDD....',
];

/** The button row and the weather (R16.4). */
Object.assign(ICONS, {
  // A stand-in until portraits exist.
  'ui/portrait': [
    '.....kkkkkk.....',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
    '...kkwkkkkwkk...',
    '...kkkkkkkkkk...',
    '...kkkwkkwkkk...',
    '....kkkwwkkk....',
    '....kkkkkkkk....',
    '.....kkkkkk.....',
    '....kkkkkkkk....',
    '...kkkkkkkkkk...',
    '..kkkkkkkkkkkk..',
    '.kkkkkkkkkkkkkk.',
    'kkkkkkkkkkkkkkkk',
  ],
  'ui/journal': [
    '....kkkkkkkkkk..',
    '...kVVVVVVVVvk..',
    '..kkkkkkkkkkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkvk..',
    '..kVVVVVVVVkk...',
    '..kkkkkkkkkk....',
  ],
  'ui/map': [
    '.mmmmmm..mmmmmm.',
    '.mMMMMMmmMMMMMm.',
    '.mMMMMMMMMTMTMm.',
    '.mMMMMMMMTTTTTm.',
    '.mMMMMMMMMkMkMm.',
    '.mMMMMMMMMMLLMm.',
    '.mMMMMMMMLLLLLm.',
    '.mMMMRMMMLLLLMm.',
    '.mMMRRRMMMLLMMm.',
    '.mMMMkMMMMMMMMm.',
    '.mMMMMMMMMMMMMm.',
    '.mMMMMMMmmMMMMm.',
    '.mmmmmmm..mmmmm.',
  ],
  'ui/bucket': [
    '....kkkkkkkk....',
    '...k........k...',
    '..k..........k..',
    '.kkkkkkkkkkkkkk.',
    '.kLLLLLLLLLLLLk.',
    '.kLLLkkLLLLkLLk.',
    '.kLLkLLkkkkkLLk.',
    '.kLLLkkLLLLkLLk.',
    '..kIIIIIIIIIIk..',
    '..kIIIIIIIIIik..',
    '..kIIIIIIIIIik..',
    '...kIIIIIIIIk...',
    '...kIIIIIIIik...',
    '...kIIIIIIIik...',
    '....kkkkkkkk....',
  ],
  'ui/bag': [
    '......kkkk......',
    '.....k....k.....',
    '....kkkkkkkk....',
    '...kAAAAAAAAk...',
    '..kAAAAAAAAAAk..',
    '..kaaaaaaaaaak..',
    '..kAAAAkkAAAAk..',
    '..kAAAAkykAAAk..',
    '..kAAAAkkkAAAk..',
    '..kAAAAAAAAAAk..',
    '..kAAAAAAAAAAk..',
    '..kaAAAAAAAAak..',
    '...kkkkkkkkkk...',
  ],
  'ui/menu': [
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
  ],
  'weather/clear-day': [
    '.......Y........',
    '..Y....Y....Y...',
    '...Y.......Y....',
    '......YYY.......',
    '.....YYYYY......',
    'YY..YYYYYYY..YY.',
    '.....YYYYY......',
    '......YYY.......',
    '...Y.......Y....',
    '..Y....Y....Y...',
    '.......Y........',
  ],
  'weather/clear-night': [
    '.....OOOO.......',
    '...OOOO.........',
    '..OOOO..........',
    '..OOO...........',
    '.OOOO...........',
    '.OOOO...........',
    '.OOOOO..........',
    '..OOOOO......O..',
    '..OOOOOOOOOOOO..',
    '...OOOOOOOOOO...',
    '.....OOOOOO.....',
  ],
  'weather/partly-day': PARTLY,
  'weather/partly-night': PARTLY.map((row) => row.replace(/Y/g, 'O')),
  'weather/overcast': [
    '.........EEEE...',
    '.......EEEEEEE..',
    '.....DDDDEEEEEE.',
    '....DDDDDDEDDEE.',
    '..DDDDDDDDDDDDE.',
    '.DDDDDDDDDDDDDD.',
    '.DDDDDDDDDDDDDD.',
    '..EEEEEEEEEEEE..',
  ],
  'weather/rain': [...RAIN_CLOUD, '................', '..r...r...r.....', '.r...r...r......', '................', '....r...r...r...', '...r...r...r....'],
  'weather/storm': [...RAIN_CLOUD, '.......YY.......', '.r...rYY..r.r...', 'r...rYYYY.r.r...', '.....r.YY.......', '...r..YY..r.r...', '..r...Y..r.r....'],
  'weather/snow': [...RAIN_CLOUD, '................', '..C....C....C...', '................', '.....C....C.....', '................', '...C....C....C..'],
  'weather/wind': [
    '..........CCC...',
    '.............C..',
    'CCCCCCCCCCCCC...',
    '................',
    'CCCCCCCCCCCCCCC.',
    '................',
    'CCCCCCCCCCC.....',
    '............C...',
    '..........CC....',
  ],
});

/** Every icon above was drawn at 16×16, before D98: shown doubled until redrawn at 32. */
const DRAWN_AT_16 = new Set(Object.keys(ICONS));

/** Icons drawn at 32×32 (D98). Fish are tilted to fill the square. */
Object.assign(ICONS, {
  // The common carp, from a photo (docs/design/photo-carp.jpg, D97).
  'fish/carp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....k..kkkkkk...................',
    '.kkkekkOOOOOOkk.................',
    'kLLexOOODOoOODOkkkkk............',
    'kLgoooooDoooooOOFFFfk...........',
    '.kcggooDDoOoOoOODFFFk...........',
    '..kccggDGGooooooOfffk...........',
    '...kccDgGGGGoOoOoOFffk..........',
    '....kDDFggGGGoooooOFFfk.........',
    '.....kcfFFFgGGOoOoOOFFFk........',
    '......kfffFggGGGGoooOFFk........',
    '.......kkcccgGgGoOoOoOffk.......',
    '.........kccgggGGGooooffk.......',
    '..........kcfcgggGGoGoOOkkkkkkk.',
    '...........kRRcccgggGooofffffFFk',
    '............kckkccggGGoGFFFfffk.',
    '.............k..kkrrRGGFfFFFFk..',
    '..................krRkkFrrfkk...',
    '..................kcRk.krrrk....',
    '...................kk...kRRck...',
    '.........................kRRk...',
    '..........................kRk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The zander, from a photo (docs/design/fish_refs/Zander.jpg, mirrored, cut out with rembg, D97).
  'fish/zander': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kAkkkkkk......................',
    '.kFECeDBBAkkkk..................',
    '..kHxGGGFFDAAAk.................',
    '...kJJIHBHHFEAAk................',
    '....kLLLEJLIGEDAk...............',
    '.....kMMGGJBHHFDAkkk............',
    '......kkHIJMJIIGEBADkk..........',
    '........kHJMMLLBHFDABCk.........',
    '.........kHJMMMLLJFBACk.........',
    '..........kkJLMMLLGBDABk........',
    '............kkILMLLLFDAk........',
    '..............kkkJLLJHDBkkkkkk..',
    '.................kkIJJHEAABBDDk.',
    '...................kkIJHFEDDEBk.',
    '.....................kkHGEDBDk..',
    '......................kEECEEk...',
    '......................kCECEk....',
    '......................kCCBEk....',
    '......................kCEEk.....',
    '.......................kFk......',
    '........................k.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The cassalan pike, from Wikipedia's photo (docs/design/fish_refs/Amur pike.jpg, cut out with rembg, D97).
  'fish/cassalan-pike': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkk.........................',
    '..kHDEBkkk......................',
    '...kJIGEBBkk....................',
    '....kMBeeEBAk...................',
    '.....kJexFFCAkk.................',
    '......kJIIGBCBAk................',
    '.......kMILJGFCBkk..............',
    '........kkkMIBGEBAk.............',
    '...........kJJJGFCAkk...........',
    '............kJJIHGBBAkkkk.......',
    '............kILkMJGFCAADDk......',
    '.............kGHkMIGBEABDk......',
    '..............kkkJMMIGFBk.......',
    '.................kkHIMHFBkkk....',
    '...................kFGkIFCBDkk..',
    '...................kGFkkGEDBDDk.',
    '....................kHkkEDEDDk..',
    '.....................k..kEEkk...',
    '........................kFEk....',
    '.........................kEk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The frostfin char, from Wikipedia's photo (docs/design/fish_refs/Arctic char.jpg, cut out with rembg, D97).
  'fish/frostfin-char': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkk.........................',
    '.kBEBAAkkkkk....................',
    '.kLCeeGBCCBAkkk.................',
    '..kLexHBBDGGEAAkkk..............',
    '...kHLLEBDGGHHEACGk.............',
    '....kHMFCGEEEEHHCACk............',
    '.....kkLHHJFFFEEGGBkk...........',
    '.......kkFFJIIFFEEGEAk..........',
    '.........kIJIJJJIFEGGCkk........',
    '..........kkFIJJMMJFHDDBkkkkkk..',
    '............kkFEFMMMMLHGDCGCBAk.',
    '..............kkHkkJJIIJHGCABk..',
    '................k..kLDAkkEBAAk..',
    '....................kkk..kHDAk..',
    '..........................kkCk..',
    '............................k...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The great sea salmon, from Wikipedia's photo (docs/design/fish_refs/Atlantic salmon.jpg, cut out with rembg, D97).
  'fish/great-sea-salmon': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kBkkkk........................',
    '.kEDDAAAkkk.....................',
    '..kIFeeEEBAkk...................',
    '...kHexIGGEDAkkkk...............',
    '....kIIJIJGGFDBCCk..............',
    '.....kLJHJLJGGFEBCk.............',
    '......kJGJkMLJHIFDBk............',
    '.......kkLkkkkMLJFGEkk..........',
    '.........k...kMMMLLIEDkk........',
    '.............kFkkkkLJEDBk.......',
    '..............k....kkLIDkkk.....',
    '....................kkkJDBDkkk..',
    '...................kGk.kJEEDCCk.',
    '....................k..kLGDCCk..',
    '.......................kFECCk...',
    '........................kECk....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The black crappie, from Wikipedia's photo (docs/design/fish_refs/Black crappie.jpg, cut out with rembg, D97).
  'fish/black-crappie': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.......kkkkkkkkkk...............',
    '..kkkkkAAAAAAAABGkk.............',
    '.kCBBBAABBDDCBAACEGkkkkk........',
    '.kDBexCEGBGDBEDBAABGIMMLk.......',
    '..kIxxJLGLEHEGECBAACGMMILk......',
    '..kGEHLLBDDBHEBDBBAABHMBMk......',
    '...kHEIHICDHIIGDDBBAAEILLk......',
    '...kHHIBDABGGBGDBCBBADBLMk......',
    '....kEHIEDEHHDECEDBBACJMMk......',
    '.....kGGGHGGBDEBCCBDBBEkk.......',
    '......kJGGEHDECDDDDCDBAkkkkkkk..',
    '.......kLHGHGEBDDBCCBCBBBDHHLLk.',
    '........kkIGGEECDDEDDDBBBFJLLLk.',
    '..........kkCDFCECDBHHBCDBHMBLk.',
    '............kkDFEDDGEJGDDDJILk..',
    '..............kEEHHLJIkDBGJIk...',
    '...............kDGHIJk.kHIJLk...',
    '................kkHkk..kIIBJk...',
    '..................k.....kIJk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The brown bullhead, from Wikipedia's photo (docs/design/fish_refs/Brown bullhead.jpg, cut out with rembg, D97).
  'fish/brown-bullhead': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....kkk........................',
    '....kBCAkkkkk.kkkk..............',
    '...kCGeeAAAAAkCEDFk.............',
    '...kAJexCBEECAACDFk.............',
    '..kAkkIMHEGHGGEAAkk.............',
    '...k..kMkIEGJJJHCAAkk...........',
    '.......kkMGEHLLJJHCAAk..........',
    '.........kMMMLLLLLJGBAkk........',
    '..........kkIMMMMLLLHEBCk.......',
    '............kGIIMMMMLLGCkk......',
    '............kFDFIMMMMLJHECkk....',
    '............kFFkGHIIIIIIHGEDkk..',
    '.............kk.kFFFDDGIHEEDDFk.',
    '.................kDCDCkkGDCCDFk.',
    '..................kkkk.kDDDCCk..',
    '........................kDDCk...',
    '.........................kkk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The brown trout, from Wikipedia's photo (docs/design/fish_refs/Brown trout.jpg, cut out with rembg, D97).
  'fish/brown-trout': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kDkkkk........................',
    '.kLJDCCEkkk.....................',
    '..kLLeeIFJEkk...................',
    '...kLexFHIIHHkkkk...............',
    '...kCJHCCILJLHEADkk.............',
    '....kAEFDGILLJIGCABk............',
    '.....kAGBBGGGLLLICBk............',
    '......kCGGDCDGIJLHHDk...........',
    '.......kEFJGCDDJLJMFEk..........',
    '........kkCFECDGIMMJJGkkk.......',
    '..........kkFFAAGJLJJHEECk..k...',
    '............kCECGJIIEHHHEkkkAk..',
    '.............kkEFIIGDIHMMIECDBk.',
    '...............kkACFEFJJIIECDBk.',
    '.................kkAFFCEJGCADk..',
    '...................kEGBkkCCCBk..',
    '....................kkk..kCDBk..',
    '..........................kDk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The central mudminnow, from Wikipedia's photo (docs/design/fish_refs/Central mudminnow.jpg, cut out with rembg, D97).
  'fish/central-mudminnow': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kBBkkk........................',
    '.kDCDBBAkkk.....................',
    '..kGexEDCAAkk...................',
    '..kHxxEEECAAAkk.................',
    '...kIIHFDAAABAAk................',
    '....kkIIHECBDCBAkkkkk...........',
    '......kLIJJFCDCBACFGHkk.........',
    '.......kkJJHFEDCBACGGILk........',
    '........kMMLIHFECCBCGHIk........',
    '.........kkkLLIFEDCBDFIk........',
    '............kJIIHFDDCBEk........',
    '............kMMkIHHEDCCBkkkkk...',
    '............kLLkkMIHFEDBCEFGIk..',
    '.............kk.kMMMIFEBEEGGHLk.',
    '................kLMMLkFEEFGGHLk.',
    '.................kLLk.kkFGGGILk.',
    '..................kk....kFGHLk..',
    '.........................kHLk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The channel catfish, from Wikipedia's photo (docs/design/fish_refs/Channel catfish.jpg, cut out with rembg, D97).
  'fish/channel-catfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkk........................',
    '.kJFFHJJkkkkkk..................',
    '..kJEeeFFDJJJJk.................',
    '..kJLexJFBBDHFLk................',
    '...kkJJJCABBBDHJk...............',
    '.....kMLLECBBBBDHkk.............',
    '......kLMLGGBABBCEHkk...........',
    '.......kkMLIICBCCBDFJkk.........',
    '.........kkHBFCEEECCFFIk........',
    '...........kFILIIGGCADIk........',
    '............kkkEGIIIEADkkkkkk...',
    '..............kHDAEGIGBDHHJJJk..',
    '...............kkFDABIICDBDFIJk.',
    '.................kkILkkEBACGLk..',
    '...................kk.kFDAIkk...',
    '......................kJDDIk....',
    '.......................kFGJk....',
    '........................kkk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The cisco, from Wikipedia's photo (docs/design/fish_refs/Cisco.jpg, cut out with rembg, D97).
  'fish/cisco': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkk........................',
    '.kFDAABAkk......................',
    '..kHBexDFBkk....................',
    '...kGxxHFICAkk.kkk..............',
    '....kGFGHHHGCAkBBAk.............',
    '.....kFFMMIHEEABHFk.............',
    '......kHMMMIHHGABHk.............',
    '.......kILMMLIIGEAk.............',
    '........kkkMMMLIHEBk............',
    '...........kJLMMLHEAkk..........',
    '............kIJJLLHGCBk.........',
    '............kLMHkHLJHEAkkkkkkk..',
    '.............kMk.kHJLIGCBDDDBBk.',
    '..............k...kJkkIFDDFFBk..',
    '...................k..kFDBkkk...',
    '.......................kDDk.....',
    '.......................kDDk.....',
    '.......................kBDk.....',
    '........................kBk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The mainland whitefish, from Wikipedia's photo (docs/design/fish_refs/European whitefish.jpg, cut out with rembg, D97).
  'fish/mainland-whitefish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kCBBAkkkk......................',
    '.kFCeeBCCBkk....k...............',
    '..kFexEHHCCBkkkkCk..............',
    '...kFCDFIIHECACECk..............',
    '....kkHCILHFFCCCCk..............',
    '......kFCILHIHFCBk..............',
    '.......kJMMLLHIHEBkk............',
    '........kkLLMLJIHHCAk...........',
    '..........kJkMLJHHICBkk.........',
    '...........kFkkMLJFHEAAk........',
    '..........kDDk.kMMLIHEBk........',
    '..........kFEk..kMMLLHEBkkkkk...',
    '...........kk....kFFFFJHCBAAAk..',
    '..................kBkkkkEBABk...',
    '...................k....kAAk....',
    '........................kABk....',
    '........................kABk....',
    '.........................kBk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The grayling, from Wikipedia's photo (docs/design/fish_refs/Grayling.jpg, cut out with rembg, D97).
  'fish/grayling': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkk........kkk..............',
    '..kAAAAkkkk.kkkCDCk.............',
    '.kCCeeCCCCAkCCBACCBk............',
    '..kEexGEEEEDAABCCBCBk...........',
    '...kEGGGHGJHHCAABBBBBk..........',
    '....kGEFGJLHHHHAABCBBBk.........',
    '.....kGFFHMLLJJJEACCCBk.........',
    '......kkJMMkIGLJHGAkkk..........',
    '........kGHkkkHLJJJAk...........',
    '.........kkGHMLLHLJHAkk.........',
    '...........kFEIMkLMJJACk........',
    '...........kFBFIGMLkLJABk...k...',
    '...........kFFkkkGGMMMJCAkkkEk..',
    '............kk...kkDDGLLGDEEGk..',
    '..................kFBFkGEDGGk...',
    '...................kGk.kCEEk....',
    '....................k...kEGk....',
    '........................kCEk....',
    '.........................kHk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The lake whitefish, from Wikipedia's photo (docs/design/fish_refs/Lake whitefish.jpg, cut out with rembg, D97).
  'fish/lake-whitefish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkk........................',
    '.kAAAAAAkkk.....................',
    '.kHCexCFIBCkk..kkk..............',
    '..kLxxHGFFFFBkkBCBk.............',
    '...kJHFHFDDDFFBBCAk.............',
    '....kLFHHFFCCFFCBAk.............',
    '.....kLHCFHFDEEFFBk.............',
    '......kkFCLJFGFFGDBk............',
    '........kMMMLJFGFBECk...........',
    '.........kkMMLJHHFFECkk.........',
    '...........kGLMLJHHFEBBk........',
    '...........kGHLLLJFDDCCk........',
    '...........kDDkkkLHIHHFEkkkkk...',
    '............kk...kkJJJHHFCCCBk..',
    '..................kCCkkHGDBkk...',
    '...................kk..kBCk.....',
    '........................kDAk....',
    '........................kAAk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The largemouth bass, from Wikipedia's photo (docs/design/fish_refs/Largemouth bass.jpg, cut out with rembg, D97).
  'fish/largemouth-bass': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '........k.......................',
    '...kkkkkCkkkkk..................',
    '..kEEEIFHEHIHFkk................',
    '.kBBeeLIHHHHLLLEkkk.............',
    '..kBexLIIEEHHLMLLLFkkk..........',
    '..kDDDLIHEHCEEHMMMMIFFk.........',
    '...kDDDDECBECCCELMMLBBk.........',
    '....kDDDDDHHHECEEIMMEk..........',
    '.....kkGGLLJIIHCCCHLHMk....kk...',
    '.......kBGJJJJGGDCBBELMkkkkCCk..',
    '.......kECkGJJJGGGGEECFMMIFCBAk.',
    '........kk.kkGGGGJJGJJHCIFBAAk..',
    '.............kkkAABkkkDGECAAAk..',
    '................kABk..kkAFCAAk..',
    '.................kk.....kAFCk...',
    '.........................kACk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The rudd, from Wikipedia's photo (docs/design/fish_refs/Rudd.jpg, cut out with rembg, D97).
  'fish/rudd': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kAkkkkkk......................',
    '.kAAAAABBBkkk...................',
    '.kDBeeBDGGDDDkk.................',
    '..kGexBBBJGHLEDkkkkk............',
    '...kEEDBEGMGGGDBAEIJk...........',
    '....kHDEDHJMMLJEBBIHk...........',
    '.....kGDEELJMLMLHDBk............',
    '.....kEJIEEJGJJMLGEkk...........',
    '......kkGJGHHJJJLMMEBk..........',
    '........kkGGLMMJJHLLDBk.........',
    '..........kkEILLJHHHIGDkkkk.....',
    '............kkGGFIIGGGHEBCCk....',
    '..............kkkFIkkkEEFFCCk...',
    '.................kk...kACFkk....',
    '.......................kCCk.....',
    '........................kCk.....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The sauger, from Wikipedia's photo (docs/design/fish_refs/Sauger.jpg, cut out with rembg, D97).
  'fish/sauger': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kGCCBkkkk.kkkkk................',
    '.kIIECCBCCkEEEGEk...............',
    '..kkEIexHFBACEEEEk..............',
    '....kJxxIHAAAFDCGk..............',
    '.....kLIDDDDBFFCEk..kk..........',
    '......kLJHHHBBFFAAkkIIk.........',
    '......kLMMJIECHCBBBCJIEk........',
    '.......kJMMLIIIHHFFBBIEk........',
    '.......kLMkkMMJJHAAABDEk........',
    '........kk..kkkMLJHHFBCk........',
    '...............kkLMJIBBkkkk.....',
    '.................kLLMLJHBBDkk...',
    '.................kLMJkkLJFFDHk..',
    '..................kkk..kkHHDk...',
    '.........................kHHk...',
    '..........................kHk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The silver carp, from Wikipedia's photo (docs/design/fish_refs/Silver carp.jpg, cut out with rembg, D97).
  'fish/silver-carp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkk......................',
    '.kDAAEAADFkk....................',
    '.kHDexACCHHHkk..................',
    '..kHxxEGCLLJHHkk................',
    '...kIGGCFHFJJLHFkk..............',
    '....kMLCDDCDLMLLEJkk............',
    '.....kMIBBFDDHLLLEFMk...........',
    '......kMIDFIDDFJLLHk............',
    '.......kMLHDDDDFHJLHk...........',
    '........kkLHFBBDDDHLFk..........',
    '..........kJJLFDBBBFJHk.........',
    '...........kLMLIFFDBBFHkkk......',
    '............kkkkHHJJBBCFCAkkkk..',
    '................kkJkMIBAACCCEGk.',
    '..................k.kkkAAEHJIk..',
    '......................kFCEIkk...',
    '.......................kECJk....',
    '........................kEHk....',
    '.........................kEk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The smallmouth bass, from Wikipedia's photo (docs/design/fish_refs/Smallmouth bass.jpg, cut out with rembg, D97).
  'fish/smallmouth-bass': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkkkkkk.................',
    '..kCCCCAACBDEGBk................',
    '.kHHexCCECBABBGHkkkkkk..........',
    '..kHxxGGEEEFCACAEIJLJMk.........',
    '...kHFFILGFCCFCBCBEILLMk........',
    '....kIJJJEEEDFDDDBBCILLk...kkk..',
    '.....kHIHHGFCFGDDBAACJMk.kkJMJk.',
    '......kIHHHFFFFFFFFBACHkkHIMMMk.',
    '.......kkGGJHFFDCDDCCBAAAEJMMMk.',
    '.........kILkJHDDDDCBBAAAAJLJk..',
    '..........kk.kkJIHHGFDBAABIJLk..',
    '...............kkGGJLkkkFEIJLk..',
    '.................kGIJk..kkGIJMk.',
    '..................kkk.....kkkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The walleye, from Wikipedia's photo (docs/design/fish_refs/Walleye.jpg, cut out with rembg, D97).
  'fish/walleye': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkkk.....................',
    '.kHEFFHHHFFkkkkk................',
    '.kFHCexCDFDDDIHLk...............',
    '..kIHxxCBAABGDBHLk..............',
    '...kkHDCABADGDCDCFkkkkk.........',
    '.....kHFEBAACGDGDACEHLMk........',
    '......kkBBBBCHDDHDDCBHLLk.......',
    '........kECFFHHDHFDDDBHMk.......',
    '.........kkGJIIHHHCGFDBIk.kkkk..',
    '...........kkkLLJIIIIHFCCkGGJLk.',
    '..............kkkkkLLLHIECDHLMk.',
    '..................kMkMkkJHDLMk..',
    '..................kMMk..kDGJLk..',
    '...................kk....kJJLk..',
    '..........................kLk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The frostfin grayling, from Wikipedia's photo (docs/design/fish_refs/Arctic grayling.jpg, cut out with rembg, D97).
  'fish/frostfin-grayling': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkk........................',
    '.kLFBGLMkkkkk...................',
    '..kDexEGLMMFFkkk................',
    '..kAxxEEGLMMLJJJk...............',
    '...kABBEGGLLLMLJJk..............',
    '...kMJDBEGGGLLMMJJk.............',
    '...kMMBABEGGGLMMLFHk............',
    '....kkkAABFEGGGLLFELk...........',
    '.......kAADDEEGGHLBFMk..........',
    '........kkAABFGGHHLHHk..........',
    '..........kCCDFHHHHLHk..........',
    '..........kIIDCDFHHFLLk.........',
    '..........kIIDkCCDFFFLMk........',
    '..........kCDk.kkCCDDDHk........',
    '...........kk....kCCCDDHkkk.....',
    '.................kCCCCDDDBCkkk..',
    '..................kCCkkBBBCCCAk.',
    '...................kk.kAACCCkk..',
    '.......................kACkk....',
    '........................kk......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The bowfin, from Wikipedia's photo (docs/design/fish_refs/Bowfin.png, cut out with rembg, D97).
  'fish/bowfin': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kHDkkkkkk.....................',
    '..kHDFFDBCCkkkkkk...............',
    '..kMJexDFDCBCDHIIkk.............',
    '...kLxxFCDECBBCFHFHk............',
    '....kJLJFIHDDCBACFFHk...........',
    '.....kkLHIJIHDCBAADFHk..........',
    '.......kkGILJHECBAADFHk.........',
    '........kIJMMLIEDBBABFFk........',
    '.........kkkMMMJFDCBAADHk.......',
    '............kkMMLIECBAACFk......',
    '..............kMMMJHDBAAEFk.....',
    '...............kkMMLHDCAADHk....',
    '.................kMMMJFDBADkk...',
    '..................kMLMJHFCDHIk..',
    '...................kkkkIGEEHIJk.',
    '.......................kGGGIIJk.',
    '........................kEGGILk.',
    '.........................kkGIk..',
    '...........................kk...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The brook trout, from Wikipedia's photo (docs/design/fish_refs/Brook trout.jpg, cut out with rembg, D97).
  'fish/brook-trout': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkk........................',
    '.kBGBBAAkkkk....................',
    '..kBeeEECEEGkk..................',
    '..kBexEHEGGGGGkkkkk.............',
    '...kHBECCHHHHGEEBABk............',
    '....kkBBHHGJHJGECBBBk...........',
    '......kkDDIHHJHHEBBBk...........',
    '........kDBMJJJJJECAk...........',
    '.........kkMMMMJLHGCCk..........',
    '...........kkIMMLJHJEEkk........',
    '.............kDBMMJLJJHGkkkkk...',
    '..............kkkIMMLMJIIIIHAk..',
    '.................kkDDIMIIIGAAAk.',
    '...................kkkkMEIGABk..',
    '.......................kkkEBk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The common bream, from Wikipedia's photo (docs/design/fish_refs/Common bream.jpg, cut out with rembg, D97).
  'fish/common-bream': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.......kkk......................',
    '..kkkkkAAAkkk...................',
    '.kBAAACCCCCCCkk.................',
    '.kFDeeEGEEEEEEEk................',
    '..kFexGIGIGGGGGGk...............',
    '...kDHIIIIJJLIGGGk..............',
    '....kkHIHIIILMJIGEkk............',
    '......kLHHIILMLJIGGCk...........',
    '.......kkHHJJLLLJJIGCk..........',
    '.........kkHJLLLLLLJGEkkkkkkkk..',
    '...........kkHJJLLMMMMGCDDDBBAk.',
    '.............kDFDDDDDMMFDBBBkk..',
    '..............kDBAkkkkHDBAkk....',
    '...............kAk...kDBAk......',
    '................k....kDBAk......',
    '......................kBAk......',
    '......................kBAk......',
    '.......................kAk......',
    '........................k.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The golden shiner, from Wikipedia's photo (docs/design/fish_refs/Golden shiner.jpg, cut out with rembg, D97).
  'fish/golden-shiner': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkk.........................',
    '.kGAAAAkkkkk....................',
    '.kMAexBDDFCCkk..................',
    '..kGxxLADDDDGCkkkkkkk...........',
    '...kIMHDADDDFFACADDFGk..........',
    '....kJGBDDFDDDDDDEEFk...........',
    '.....kIIEEDFDDDDFDDFk...........',
    '......kkIIDDDGDFFGCk............',
    '........kLMMGGDGDILCk...........',
    '.........kkHLGGDDFDDCk..........',
    '...........kEHLMIFGFDCk.........',
    '...........kEHkFLLFDFGGkkkkk....',
    '............kk.kHFFFFDDGFBBBkk..',
    '...............kEHHIFkDDBFHLJMk.',
    '...............kHFkkk.kBAHJMkk..',
    '................kk....kAAEJk....',
    '.......................kBHJk....',
    '........................kJMk....',
    '.........................kGk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The white sucker, from Wikipedia's photo (docs/design/fish_refs/White sucker.jpg, cut out with rembg, D97).
  'fish/white-sucker': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....k..........................',
    '..kkkAkkkk.......k..............',
    '.kBBCBAAAAkkk...kEk.............',
    '.kGMIexEDCCCCkkkFFk.............',
    '..kEJxxLLIFFDDCDFLFk............',
    '...kkJJGGIIMIHFDFFFk............',
    '.....kGMMHIJMMLHFDCk.......k....',
    '......kkIEJJMMMMIHDCkkkkkkkBk...',
    '.......kAkkGJJIMMIIHDCCCDDDCk...',
    '........k..kkkJGGGIHHHHHEBDk....',
    '..............kBAkkEBBkGBBCk....',
    '..............kAAk.kBAkkkAAk....',
    '...............kk...kk...kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The cassalan sleeper, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Amur sleeper.jpg, cut out with rembg, D97).
  'fish/cassalan-sleeper': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkk..........................',
    '..kIIIkkkk......................',
    '.kFGexBDFFkk....................',
    '..kGxxDJAABFkkkk................',
    '..kDABDMHIIJDIEHk...............',
    '...kDBGLLMMMMDDIJkkk............',
    '...kFGDJJMLJJMJDFkJJk...........',
    '....kkDDLJACHJMJDDEEBk..........',
    '......kFGCCEHHLMMJDBBEk.........',
    '.......kIBCEEHJIJLJDBAk.........',
    '........kFIHCELDJJJJDBAk........',
    '.........kkIJJGGGJGGDBDkkkkkk...',
    '...........kkIIGDGGGGDBBBBCCEk..',
    '.............kkDDDBDBDDBBACEHHk.',
    '...............kDGDBDDDBAACEHLk.',
    '...............kMMMMkkkkACCHHHk.',
    '................kkkk...kACHHHk..',
    '........................kCHHk...',
    '.........................kkk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The asp, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Asp.jpg, cut out with rembg, D97).
  'fish/asp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkk.......................',
    '.kEEHCAABkkk....................',
    '..kJeeGFBAAAkk...kkk............',
    '..kMexFFDFBAAAk.kCFFk...........',
    '...kIJIFFFFFCBAkDDCGk...........',
    '....kJJEEHFFFFCAABBGEk..........',
    '.....kJEFFEIIFFCAABCk...........',
    '......kIEIIIEIIFFBAk............',
    '.......kIIJIIGEIFFAAk...........',
    '........kkJIIJIFGIFBAk..........',
    '..........kFIIIJEIIEDBk.........',
    '.........kCCBIIIIIEIEEBkkkkk....',
    '.........kDFCkkJIJIIIEFDAEDFkk..',
    '........kDFDDk.kMEHEEEFFDBCCFGk.',
    '.........kkkk...kEEkkkkFFCFEkk..',
    '................kEk....kCFGk....',
    '.................k.....kEFFk....',
    '.......................kFDDk....',
    '........................kGk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The omul, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Baikal omul.jpg, cut out with rembg, D97).
  'fish/omul': [
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kHFGGkk........................',
    '.kJJeeDCkk......................',
    '..kJexGDBBkk....................',
    '...kIMIGEDBAk...kk..............',
    '...kJIMJHEDDBkkkEEk.............',
    '....kIIMLHFEEBAEEEk.............',
    '.....kGHLLHGEEBAEFk.............',
    '......kHHLIHGFEABEk.............',
    '.......kLLLLIGFDAk..............',
    '........kJIMLHGFDBk.............',
    '.........kIJLJIGFCCk............',
    '.........kDGLLJIGFCk............',
    '.........kCBGILJIGDBk...........',
    '.........kBCEkJJJIFDAk..........',
    '.........kBkk.kIIIIFBk..........',
    '..........k....kGGIIGCkkkk......',
    '...............kFEEGIGCCCDkkk...',
    '................kkkkkJGCCCDEEk..',
    '.....................kFCBDEDk...',
    '.....................kCABkkk....',
    '.....................kDADk......',
    '.....................kCBCk......',
    '......................kBk.......',
    '......................kBk.......',
    '.......................k........',
    '................................',
    '................................',
    '................................',
  ],
  // The barbel, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Barbel.jpg, cut out with rembg, D97).
  'fish/barbel': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkk.......................',
    '..kMMMMJJkk.....................',
    '..kJHexJMMJkk...................',
    '...kAxxJJJJJMkk.................',
    '....kEGGGGGGJJMk................',
    '.....kkEDGEGGGGJkk..............',
    '.......kJGEGGGGGGGkk............',
    '.......kMJEEDEEEGDFIk...........',
    '........kMGCDEDCDDCBFk..........',
    '.........kGEDCBBBBCBk...........',
    '..........kkECDCBBBBGk..........',
    '............kkEDDBBAAGk.........',
    '..............kDEECAAAGkk.kkk...',
    '..............kJGEGEBAACGkLLIk..',
    '...............kkkkHLGBAAIkkk...',
    '..................kHLkkFLk......',
    '...................kk.kLLk......',
    '.......................kk.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The bleak, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Bleak.jpg, cut out with rembg, D97).
  'fish/bleak': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kk............................',
    '.kBAkkk.........................',
    '.kDABAAkkk......................',
    '..kDexBBBBkk....................',
    '..kFxxCCCBAAk...................',
    '...kGDFEDCCBAkk.................',
    '....kGDEFEECBAAkk...............',
    '.....kIIGFGEEDCAAkk.............',
    '......kkJIGGGIGDCBEk............',
    '........kLMJIIJIFDBk............',
    '.........kkLMJJJJICBkk..........',
    '...........kkLMMMMJGDCk.........',
    '.............kkFJIMMJFCkk.......',
    '...............kkkkkLMMFEkkk....',
    '....................kkIMIHHGk...',
    '......................kIFHDFDk..',
    '.......................kkHDkk...',
    '.........................kGEk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The bluegill, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Bluegill.jpg, cut out with rembg, D97).
  'fish/bluegill': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..........kkkkkk................',
    '.......kkkBBDBAAkk..............',
    '......kCDDEEEEEDAAkk............',
    '....kkEEEEEEEEEDEDAAkk..........',
    '..kkCGHGGEEEEEEGEDEAAAk.........',
    '.kLIexLHHGGEEEEEEEEEAABk........',
    '.kILxxJJEHHEGEEEEEGGEBBBk.......',
    '..kLJJLHELJHGEGGGGEEHCBk........',
    '...kLMLGHJLLJHHHGHEEEDk.........',
    '...kEJHGJJMMMLJHHHGEGEBkkkkkkk..',
    '...kDGGGHMMMMMMJHHHGEEEDDCCFFCk.',
    '....kAEHJLMMMMMJLJJJHGGGGDCCCBk.',
    '.....kAADHJJLMLLMJLJJJJHGDCCBk..',
    '......kAAADGHJJJLLLJDDkDECBCBk..',
    '.......kAAAkCFFFIFFFkk.kkCBCCk..',
    '........kAk.kkkkABBBBk...kCFk...',
    '.........k......kkBBk.....kk....',
    '..................kk............',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The burbot, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Burbot.jpg, cut out with rembg, D97).
  'fish/burbot': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.........kk.....................',
    '........kHLk....................',
    '...kkkkkIIHk....................',
    '..kBCBCAexDCkkkk................',
    '.kIGGGGExxAAABGLk...............',
    '..kkkIJIJIGFFBBBkkkk............',
    '.....kkkIJGFHFBFBCLLk...........',
    '........kkIHHLHHFBDLLk..........',
    '..........kkJJIGGDCCLLk.........',
    '............kkkIGGDCDHLk........',
    '...............kIIEFFHHHk.......',
    '................kkkEDFDHk.......',
    '...................kECDCHk......',
    '...................kGECCCGk.....',
    '....................kEBCDHk.....',
    '.....................kGBBFHk....',
    '.....................kIDCFLk....',
    '......................kGEGGk....',
    '.......................kkEDHk...',
    '........................kGDFGk..',
    '.........................kGFHFk.',
    '..........................kkkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The chain pickerel, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Chain pickerel.jpeg, cut out with rembg, D97).
  'fish/chain-pickerel': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kJHBBkk........................',
    '..kMHHEBkkk.....................',
    '...kMHexCBBkk...................',
    '....kMxxDCCAAkk.................',
    '.....kMLJIFCAAAk................',
    '......kMLGIGFDAAkk..............',
    '.......kkLLIDFDCAAkk...kk.......',
    '.........kMMJDDDCCAAkkkEHk......',
    '..........kkMJIDDGCCACEEHk......',
    '............kJLJIIDDCAEHHk......',
    '.............kHLMJJGGDCCk.......',
    '.............kJkkkMLLJHDCkkkkk..',
    '..............k...kEJJLJGCCEHHk.',
    '...................kJJJkJCEHkk..',
    '....................kJk.kEHk....',
    '.....................k...kHJk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The chub, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Chub.jpg, cut out with rembg, D97).
  'fish/chub': [
    '................................',
    '................................',
    '................................',
    '...kkkk.........................',
    '..kMLLLkkk......................',
    '.kHLexLLLHkkk...................',
    '.kCLxxLJJIIHLk..................',
    '..kELLMMJIIIILkk................',
    '...kEIJIJJIIIIIIk...............',
    '...kAEJJJJJIIIHHIk..............',
    '....kADJJIMJJIIHHIk.............',
    '.....kBFHILJJJIHFFIk............',
    '.....kCCFFIIJIIHFDHHk...........',
    '.....kGBFHIIJIIHFDDHCk..........',
    '.....kGkBFHHIIIIHFCDCCk.........',
    '......k.kkCEFHHHFFDBDBk.........',
    '..........kBCDFFFFDCBBk.........',
    '...........kBCDFFDDCAEk.........',
    '...........kIFDDDDDDBBk.........',
    '............kHCCCDCCCACk...kk...',
    '............kGkCCCCCBAAEkkkCCk..',
    '.............k.kBBBBBBAABCDECk..',
    '................kBCCCAAAAFGEEk..',
    '................kCCDFkAACCBkk...',
    '.................kBDkkACCAk.....',
    '..................kk..kEBAk.....',
    '......................kCBk......',
    '......................kBk.......',
    '.......................k........',
    '................................',
    '................................',
    '................................',
  ],
  // The wildlands perch, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Creole perch.jpg, cut out with rembg, D97).
  'fish/wildlands-perch': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kFAkkkkk....kk................',
    '..kGBGAABFkkkkIEk...............',
    '..kIFeeFDBBFHHIGk...............',
    '...kIexJIGDDBHJIAk..............',
    '....kFGDFIIFBBEIHkkkk...........',
    '.....kkIJIJJGFDBFGGCDk..........',
    '......kIIIIHGIGDAEGFDGk.........',
    '......kDIIGGILJIGAFHDBk.........',
    '.....kEFDkJJLLLJIGBBGBk.........',
    '.....kDDDkkJJJLLLLGDFk..........',
    '.....kFkk..kIJJLMLLJDBkk........',
    '......k.....kkGIJLLJIFBEkkkk....',
    '..............kEFIHJLJHABCAAkk..',
    '...............kEFFFkkGICBAABBk.',
    '................kEDk..kECBCBCk..',
    '.................kk....kCADCk...',
    '........................kABCk...',
    '.........................kCCk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The crucian carp, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Crucian carp.jpg, cut out with rembg, D97).
  'fish/crucian-carp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '..................kkk...........',
    '.................kFFFk..........',
    '.........kkkkkk.kCECFFk.........',
    '...kkkkkkAACAAAkCECCEHk.........',
    '..kCABAABBACCBABACECEFIk........',
    '.kJGeeDBBBBBBBAAAAACCEHk........',
    '.kJIexIDDDBDDBAAAAABEECFk.......',
    '..kJGGGGGGDDDBBBBABACCEFk.......',
    '...kJJGDGGIGDDBBBACABCCEHk......',
    '....kJGDGJGIGDDDDBBAACEEHk......',
    '.....kIGIIIIJIGGDBAAACCEEk......',
    '.....kJIIJIJJJIGGDDDBAEHHk......',
    '......kJIJIIIJIIGGDDBBkkk.......',
    '.......kGIJJJIJIJIIDDBCk........',
    '........kIIIJJJJMJIJDABk.kkkk...',
    '.........kkJJIJJJJJIIGDBkBDIHk..',
    '.........kBDGIJJIJIJIIGBCDDHFHk.',
    '........kFDDFkkIJIJJIIIIGGFHIk..',
    '........kFHFIk.kEEEEkkGGDIHHEk..',
    '........kFHkk..kHEEFk.kDDFFEk...',
    '.........kk....kEFHk...kFFHFk...',
    '................kkk....kEHIk....',
    '........................kFIk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The dace, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Dace.jpg, cut out with rembg, D97).
  'fish/dace': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkk.......................',
    '.kAABBBAAkk.....................',
    '.kBJexGBEAAkkk...kk.............',
    '..kGxxLDHHBBAAkkkCCk............',
    '...kDMLJJDDDDBAACFCk............',
    '....kLGDDIHHDGEBBCCk............',
    '.....kkFFGJGGDDGEAk.............',
    '.......kkGGLGJIHIGAkk...........',
    '.........kMMMLGGDHEAAk..........',
    '..........kkGGLLGJGEEAkk........',
    '...........kFFGGGLLLDDEAkkk.....',
    '...........kFCkkkBDGDGGEBDDkk...',
    '............kk..kFFFkkGIDDFFFk..',
    '.................kkk..kEDFkkk...',
    '.......................kDHk.....',
    '........................kFk.....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The deepwater sculpin, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Deepwater sculpin.jpg, cut out with rembg, D97).
  'fish/deepwater-sculpin': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...........kkkk.................',
    '.....kkk..kDDCGk................',
    '...kkAECkkDDFDk.................',
    '..kCEeeAABGEDkkk................',
    '.kBCCexCCACDAABCk....kk.........',
    '.kCCEEBABDECFBCCEkkkkBBkk.......',
    '..kHJGHDDDGDBCDDDDGGJGGCBk......',
    '...kCJJHGCEJDJJDIDFIILDHDk......',
    '....kCCGGGMJMLJJJGFDFJDCCk......',
    '.....kkHLJJLMMLGIDIDJDDCCk......',
    '.......kBDGJJLDFIFFJGCBBBk......',
    '.......kBkkGDDFFDFDIDCBCk...k...',
    '........k.kDIFFGDDIHJDDCkkkkDk..',
    '...........kEGGDGJDGEDJGFBDDHCk.',
    '............kkDGDkkkCDHkkJDCDHk.',
    '..............kkk...kkCk.kDGGk..',
    '......................k..kDGJk..',
    '..........................kkk...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The mainland bullhead, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/European bullhead.jpg, cut out with rembg, D97).
  'fish/mainland-bullhead': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkk.........................',
    '..kFILMkk.......................',
    '.kDCeeLMMkk.....................',
    '.kIDexDIIHIkkkk.................',
    '..kIDBCFHFFFFHGk................',
    '...kIDCFFIDFFCFHk...............',
    '....kHHGDHHDDDFIkkkk............',
    '.....kJJJLJHFDCFCHJJkk..........',
    '......kHHHJHHLHDBBEHJLk.........',
    '.......kGIMLJJGAABCEGGk.........',
    '........kkkkLLHCAABCEHJk........',
    '............kkMFFCABCGHJk.......',
    '..............kLLICAABDJk.......',
    '...............kMMHHBABCkk......',
    '................kkMMFGBABDkk....',
    '..................kkkLICAEGGk...',
    '.....................kkkCEGEEk..',
    '........................kkGEBEk.',
    '..........................kkBk..',
    '............................k...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The mainland mudminnow, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/European mudminnow.jpg, cut out with rembg, D97).
  'fish/mainland-mudminnow': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkk.....................',
    '..kGFFDDDDDkkkk..kk.............',
    '.kIFexAAABBBBDHkkIIkkk..........',
    '..kIxxBBACEGBBBBDIJJJJk.........',
    '...kHEEBBBBCEEBBBBDIJk..........',
    '....kJIEECFCBCGECCBDHIkk........',
    '.....kkIJIGFFCEEECBBDHkJk.......',
    '.......kkIIIFFFEBCECBDkk........',
    '.........kJLJIGGFEGCCCkk........',
    '..........kkLJJIHGEECFCDkkkk....',
    '............kkJJJIIGFFECDHJLk...',
    '..............kkkkkIHFECEFIMMk..',
    '...................kkHGECFJMMLk.',
    '.....................kkEFJMMLMk.',
    '......................kIJLMMMk..',
    '.......................kLMMMMk..',
    '........................kMMLk...',
    '.........................kkk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The golden dorado, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Golden dorado.jpg, cut out with rembg, D97).
  'fish/golden-dorado': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....kkkkk.......................',
    '..kkFCCCBkk.....................',
    '.kHkHeeFCABkk...................',
    '..kFFexGFAAABkk.................',
    '...kCIIICCBAAAEkkkkk............',
    '....kFIFFFHCAAACHECEk...........',
    '.....kJDJLHHFCBACCCk............',
    '......kDIJMHHFFCBBEk............',
    '......kIGDJLJHHFECBk............',
    '.......kLkkGLLLLHHCCk...........',
    '........k..kGGLLLJHHCkk.........',
    '...........kJIDIJJJFHEHk........',
    '............kLkkkIJJLJEEkkkk....',
    '.............k..kGGIIIJHFLIGk...',
    '.................kMMMMkGHCDGk...',
    '..................kkkkkDDAAk....',
    '.......................kGLCk....',
    '........................kMk.....',
    '........................kMk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The grass carp, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Grass carp.jpg, cut out with rembg, D97).
  'fish/grass-carp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkk.......................',
    '.kHABAAADkk.....................',
    '..kBFexAAIGkk...................',
    '...kLxxAIFEFGkk.................',
    '....kMJBCFFAAIDkk...............',
    '.....kMAFBAAAJEIHkk.............',
    '......kHCAAABIJIICLk............',
    '.......kkCCABBCEFJFk............',
    '.........kDMLCBCFFFGk...........',
    '..........kkkLJFFGJJJkk.........',
    '.............kJMHGGGMJLk........',
    '..............kMkMLHFJFJkkkkk...',
    '...............k.kkLLLGGIICDDk..',
    '...................kMkLGCBDLGk..',
    '....................k.kHCAHkk...',
    '.......................kDBHk....',
    '........................kADk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The gudgeon, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Gudgeon.jpg, cut out with rembg, D97).
  'fish/gudgeon': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkk.......................',
    '..kCCECBBkkk....................',
    '...kDDeeECBBkkkk................',
    '...kDCexFGEECBBCkkk.............',
    '....kkABCFFHFEECCCBkk...........',
    '......kkABEFHHIFEEEECkk.........',
    '........kkABDHJJJGHGGECkk.......',
    '..........kkACHJJJJJIFGECkk.....',
    '...........kAACHHJJJJJIIIIGk....',
    '............kkkkkDCHJMLHHLFGk...',
    '.................kkkDHMLMMCDGk..',
    '....................kDkJMMMMHGk.',
    '.....................k.kkCFHMHk.',
    '.........................kkkkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The huchen, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Huchen.jpeg, cut out with rembg, D97).
  'fish/huchen': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kk............................',
    '.kBAkkk.........................',
    '.kFJHDBkk.......................',
    '..kLexECBkk.....................',
    '..kJxxGFECAk..k.................',
    '...kIIIGFFEAkkEk................',
    '....kHMIIGFECBDEk...............',
    '.....kkJMJHHFDCFk...............',
    '.......kMMMIHHICkk..............',
    '........kkMMGIIIDAk.............',
    '..........kCMMJIHDCkk...........',
    '...........kkJJMIHGDAk..........',
    '.............kkMMJHGDAkk........',
    '...............kkILICCCAkkkkkk..',
    '.................kBFIIIDADECCAk.',
    '..................kkkkkDGBCDAk..',
    '......................kDFDBAk...',
    '.......................kFCBk....',
    '.......................kBBk.....',
    '.......................kDCk.....',
    '........................kAk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The ide, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Ide.jpg, cut out with rembg, D97).
  'fish/ide': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkkk.....................',
    '.kHDCBBABAAkkk..................',
    '.kLIexHFDBBAAAk.................',
    '..kMxxFIFDDCBAAkk...............',
    '...kHIHFJHDDDCBAAk..............',
    '....kMLHEGEHDDCCAAk.............',
    '.....kMIEGEHEFDCBBAk............',
    '......kMJHJJHHFFDCABk...........',
    '.......kLMLLIHFEEDDBAk..........',
    '........kkLILJIHEDDDBk..........',
    '..........kHFIIIIJDDDBk.........',
    '..........kEEFJLHJFIIDBk........',
    '.........kEEEGkLMMLHHFDBkkkkkk..',
    '.........kGGGEkkkFFILHEFCDCCDDk.',
    '..........kkkk..kCEDHHJJFDCCkk..',
    '................kHEGGkkIFDDk....',
    '................kEFkk..kDDDk....',
    '.................kk....kDCCk....',
    '........................kDDk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The lake sturgeon, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Lake sturgeon.jpg, cut out with rembg, D97).
  'fish/lake-sturgeon': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkk........................',
    '..kCEDDFkkkk....................',
    '...kCFDCLHFFkk..................',
    '....kkkDHIexIGkk................',
    '.......kAFxxJMMEk...............',
    '........kkICEJIGDkk.............',
    '..........kEDGMLMMFk............',
    '...........kkkIJDLMHkkk.........',
    '..............kkCIEJMDBk........',
    '................kkGGDEDk........',
    '..................kkkBCEkkkk....',
    '.....................kBkCCBBk...',
    '......................k.kBAAAk..',
    '.........................kAkk...',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The lake trout, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Lake trout.jpeg, cut out with rembg, D97).
  'fish/lake-trout': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkk.........................',
    '.kDCAAAkkk......................',
    '..kEexBAAAkk....................',
    '..kHxxBDBAAAkk..kkk.............',
    '...kLGBBHCDAAAkkDCBk............',
    '....kHGGHHGFACABEFEk............',
    '.....kMHHEIHGDABBEFk............',
    '......kMHEEIHHFDBABk............',
    '.......kkJLJIIHGFDAk............',
    '.........kMMLJJIHFECkk..........',
    '..........kkMMJJJHGFDAk.........',
    '............kJMMLJIHGBDk........',
    '............kJJkJIMLJICCkkkkk...',
    '............kJIkkkLLIJJHCBEECk..',
    '.............kHk.kJIkkkLHFDEDk..',
    '..............k...kIk.kGEEkkk...',
    '...................k...kCEk.....',
    '........................kECk....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The lenok, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Lenok.jpg, cut out with rembg, D97).
  'fish/lenok': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kAAAAkkk.......................',
    '.kDBexAAAkk.....................',
    '..kExxABBAAkk...................',
    '...kJLMCDBCBAkkkkk..............',
    '....kCCJMECCCAADBAk.............',
    '.....kBFCICDBGAADBk.............',
    '......kDLJLDCCBCAAk.............',
    '.......kGEICCHBCIAAk............',
    '........kkCEHIMDCEBAk...........',
    '..........kkEEDDLBDBAkk.........',
    '............kBDLMMEABDBk........',
    '............kEBDDMDJFCBBk.......',
    '............kAkkkkCHLDCAAkkkk...',
    '.............k....kCLJCJCBBIDk..',
    '...................kIEkkLFCCBAk.',
    '...................kAk..kHCkkk..',
    '....................k....kBAk...',
    '.........................kAAk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The minnow, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Minnow.jpg, cut out with rembg, D97).
  'fish/minnow': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kCBCAkkk.......................',
    '.kHDeeABCkk.....................',
    '..kJexCECAAkk.....k.............',
    '...kEGDDGDBABkkkkkCk............',
    '....kJJGIGDDBBBECEDDk...........',
    '.....kJJEILCDCACEEEDk...........',
    '......kHHHIIDBDACHFk............',
    '.......kkHILLGDBBBk.............',
    '.........kMMLLIGDBAkk...........',
    '..........kEJMMMIDCAAk..........',
    '..........kFEkJMMMIEAAkk........',
    '...........kEkkHJHHMHCAAkkkkkk..',
    '............k.kEEEEkkJECAECHEDk.',
    '...............kEEk..kkCCFFFkk..',
    '................kk.....kFEFk....',
    '.......................kEHHk....',
    '........................kEEk....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The muskellunge, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Muskellunge.jpg, cut out with rembg, D97).
  'fish/muskellunge': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..k.............................',
    '.kEkkkk.........................',
    '..kHBAAkk.......................',
    '...kHBBDBkk.....................',
    '....kIHDGEAkk...................',
    '.....kJJHGECAkk.................',
    '......kkEEDexAAk................',
    '........kkGxxBCAkk..............',
    '..........kGEDBCCAk.............',
    '...........kGGDDBFAkkkk.........',
    '............kkDHEDCABLJk........',
    '..............kkHICICFLk........',
    '................kHIFFCDk........',
    '.................kkIIFCk........',
    '...................kkJFCkk......',
    '.....................kkIDIkkkk..',
    '.......................kIJLLMJk.',
    '.......................kHLMLkk..',
    '........................kLMk....',
    '.........................kLJk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The nase, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Nase.jpg, cut out with rembg, D97).
  'fish/nase': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkk......................',
    '.kEBBBBAAAkk....kk..............',
    '.kIJeeBDDBAAkkkkGGk.............',
    '..kMexEDDDEBAAEDDHGk............',
    '...kHHJFFHEEDBADEGGk............',
    '....kkHFFFHHEDDABDHk............',
    '......kFIIHJJEEEAAk.............',
    '.......kJJJJJLHEEBAk............',
    '........kJJJJHLHHDBAk...........',
    '.........kkFHLLJJHEAAk..........',
    '..........kFFHLMJJJDBkk.........',
    '.........kFFFkLJJJHEEBAk........',
    '.........kFFk.kkHHJJJHDAkkkkk...',
    '..........kk...kFFFHJJJDADEEDk..',
    '...............kFFFFGkHHEBDDDk..',
    '...............kFFFFFkkkCGCCk...',
    '................kkkkk...kCCk....',
    '........................kCCDk...',
    '.........................kCCk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The northern pike, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Northern pike.jpg, cut out with rembg, D97).
  'fish/northern-pike': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kCDECkk........................',
    '..kLFECFkk......................',
    '...kHGexECkk....................',
    '....kHxxFDEDk...................',
    '.....kIIGFFFDk..k...............',
    '......kGGFGHEDkkEk..............',
    '.......kDIGFHDECCEkk............',
    '........kDHFHFFFDCDEk...........',
    '.........kFMLHGGHFDCDkk.........',
    '..........kMMLJGIJHECBBk........',
    '...........kkMLLLLLIGCBAk.......',
    '.............kkDILILLJDAAk......',
    '...............kkFMLLLHDBkkk....',
    '.................kkkLLLFFBBAk...',
    '....................kBBBFCBABk..',
    '.....................kCCkCBBk...',
    '......................kkkBBBk...',
    '.........................kBk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The northern snakehead, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Northern snakehead.jpg, cut out with rembg, D97).
  'fish/northern-snakehead': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkkkkkkk.................',
    '.kHHFFCBBBDGHGIkkk..............',
    '..kMMLJJeeDDDBBEGJkk............',
    '...kkMMLexBEFEDBABFJkk..........',
    '.....kkkMMLJJHGECBACGIk.........',
    '........kMMMMJJHEFBCBCHk........',
    '.........kMMLMMLIGGECCBDkk......',
    '..........kMkkkLLJIECFBBDHk.....',
    '...........k...kIIJJHEFDBCGk....',
    '................kGEGIJFDDBDHk...',
    '.................kkIGDHGEEBHk...',
    '...................kkkDEDDAACk..',
    '......................kFFDAABJk.',
    '.......................kkkAAEIk.',
    '..........................kBEGk.',
    '...........................kkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The perch, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Perch.jpg, cut out with rembg, D97).
  'fish/perch': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '............kkk.................',
    '...kkkk....kDDDk................',
    '..kDBAAkkkkBDBDIk...............',
    '.kDBexBBAAABDDDGHk..............',
    '..kIxxDFDBAABDDDGk..............',
    '...kMLIIIDBBAABGDDk.............',
    '....kLIDDBDBAAABGBk.............',
    '.....kMLIDGBDBBAAAk.............',
    '......kMMLLDDDGAAAkkkk..........',
    '.......kJGMMGGDBBBBDDLk.........',
    '........kEGLILBDDDAADIk.........',
    '........kEEkMLILGDAABGk.........',
    '........kEEkkkLMMGDDBBk.........',
    '.........kk...kkGIIIDABkkkkk....',
    '...............kCGGkHGGDBCCBkk..',
    '................kCGkkkkBACDJGJk.',
    '.................kJk...kECDLkk..',
    '..................k.....kEEGk...',
    '.........................kEJk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The ferrstad carp, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Prussian carp.jpg, cut out with rembg, D97).
  'fish/ferrstad-carp': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkkkk...................',
    '..kAAAAAAABABkkk................',
    '.kBBeeAFADBFFCCAk...............',
    '.kEFexFGBFFGHCFBAkk.............',
    '..kGGGHFGJGFFHHFCAAk............',
    '...kGHIFMLJGGHHHIFCBkk..........',
    '....kHIDLJIJLGHIIIGCCDk.........',
    '.....kHHCFMMLMMGJMJICCk.........',
    '......kkHFLMMMMLLLLJJCkk........',
    '........kkGHMMMMLLMLLLGBkkkkk...',
    '..........kkFFJLMJJLLMJHCBBBCk..',
    '............kkkJJJHHIJIHDBCDDDk.',
    '...............kkEEEEkHFBDDEEk..',
    '................kDEEkkCBBDDkk...',
    '.................kEk..kAABDk....',
    '..................k....kBBDk....',
    '........................kBDk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The pumpkinseed, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Pumpkinseed.jpg, cut out with rembg, D97).
  'fish/pumpkinseed': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '......kkkkk.....................',
    '...kkkDDCCCkkkk.................',
    '..kFHDDEGDEDDDDkk...............',
    '.kDHexEHGGGEEEDDDk..............',
    '..kHxxIIHHEGGGEEEEkk............',
    '...kIIIIIEEGGGGEEDDCk...........',
    '...kGLILLLIHGGHGEGDCCkk.........',
    '....kIMMMILIIHFFHFGCBBAk........',
    '.....kGLMLLIIHJJJFHDBAAk........',
    '......kGLMMLIIFJJJFGBAAAk.......',
    '.......kkLMMLIJJJJJFGkkk........',
    '........kDEILIIIHJJJFGDkkkkkk...',
    '.........kDCGGHIHHHJFJFECCBBBk..',
    '..........kCkkkEFFkEEFJECBBAAAk.',
    '...........k...kkk.kkkEDBBAAAk..',
    '......................kCBAAAk...',
    '.......................kBAAAk...',
    '........................kAABk...',
    '.........................kAk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The rainbow trout, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Rainbow trout.jpg, cut out with rembg, D97).
  'fish/rainbow-trout': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....kkk.........................',
    '..kkAAAkkk......................',
    '.kBCeeCAAAkkk...................',
    '.kCFexCCBCBBBkk.................',
    '..kGHFFCCEBCBBEkk...............',
    '...kECFCEEGGDECBBkk.............',
    '....kFHDEIEGGGEBCBAk............',
    '.....kGFBGGGCIIEECBCk...........',
    '......kFAGIGGHGIGFEDEkk.........',
    '.......kDGLJIGHJJIGGHCCk........',
    '........kFGGJMIJJLLGECEDkk......',
    '.........kkGGLMLLGMLJGEGEDk.....',
    '...........kkkGGLIIMLIMGEEDk....',
    '..............kkDGJJLMMLJLEEk...',
    '................kkkIIJLJJJIEBk..',
    '...................kkDCCFFGDCk..',
    '.....................kCDkkDCBDk.',
    '......................kk..kDEAk.',
    '...........................kCk..',
    '............................k...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The roach, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Roach.jpg, cut out with rembg, D97).
  'fish/roach': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkkkkkkk.................',
    '.kBBBBBBDDDDBDDkk...............',
    '.kBEexDEDGEFEEDBDkk.............',
    '..kExxJFEFHIGEHFEBBkkk..........',
    '...kFIGEGHEEFJLJIFDBCAk.........',
    '....kFEDDFIEHJLLLJFDBk..........',
    '.....kHHEDDIHIMMLLJGEk..........',
    '......kkEEGEJIJJMMMMJDk.........',
    '........kkEJMJMLLMMMMGEk........',
    '..........kkkDEJLMMLMLFEk.......',
    '.............kkDEEFHIJJEk.......',
    '...............kkkAACDFIDkk.....',
    '.................kACkkkEEBBk....',
    '..................kCk.kBBAAAk...',
    '...................k...kAACACk..',
    '.......................kAACkkDk.',
    '........................kACk.k..',
    '........................kACk....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The rock bass, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Rock bass.jpeg, cut out with rembg, D97).
  'fish/rock-bass': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkkkkkkk................',
    '..kABBAAAAABAEFEkk..............',
    '.kHHexDCDCBCBACFIFk.............',
    '.kLFxxFDHCEDCBBBFIGk............',
    '..kLHGGHGEEFCCCBBDGEk...........',
    '..kHJJIFFGFGDCECBABGCkk.........',
    '...kHLMLFJGEGGFFCBBBGFBk........',
    '....kJJIIEGIFEGGDDBBEGEBk.......',
    '.....kLJJFGIGDIGGFDCCGFBAk......',
    '......kMLLIFEIIIGGFBCDDBk.......',
    '.......kJMMMLLJJJIIFECkk........',
    '.......kJkMMMMMLJIJIGEEDkkkkk...',
    '.......kFkkkJMMMMLLLHGGHJFDBBk..',
    '........k...kLMMMLJJJJILLFCBBBk.',
    '............kCDJJHHFkkMLJECBkk..',
    '.............kkEGIGFEkkJHEBk....',
    '...............kEDEECkkEEDBk....',
    '................kCCCk..kECBk....',
    '.................kkk....kBBk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The ruffe, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Ruffe.jpg, cut out with rembg, D97).
  'fish/ruffe': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkk...kkkk................',
    '.kCECCCAAkkkCCEEk...............',
    '.kCCeeCABAABCECEk...............',
    '..kHexCDBBBBABCCCk..............',
    '...kEEEECBBBABACEEk.............',
    '....kHHHCDDCCBBAEEk.............',
    '.....kMJDDDEDCBBAECkk...........',
    '......kJJHHHHECCBBEEEkk.........',
    '......kCJMMMMLHECCCEEHEk........',
    '......kDkJMMMLMJHCBCEEEk........',
    '......kDkkkkMMMMLHECCEEk........',
    '......kHk...kMLLMMLECBk.........',
    '.......k.....kkkJJLJHEBkkkkkk...',
    '...............kEDEkLHEBDCEEEk..',
    '................kEEkkkLECECCEk..',
    '.................kk...kCCCkkk...',
    '.......................kDCk.....',
    '........................kCk.....',
    '........................kCk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The sea lamprey, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Sea lamprey.jpg, cut out with rembg, D97).
  'fish/sea-lamprey': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kGFeekkk.......................',
    '..kBexHIMk......................',
    '...kkBBBHMkk....................',
    '.....kkCBBIMkk..................',
    '.......kkkCEJMkk................',
    '..........kkBGLMk...............',
    '............kECIMkk.............',
    '.............kkCGLMkk...........',
    '...............kkEJMFk..........',
    '.................kCHLJk.........',
    '..................kkCIJkkk......',
    '....................kCHJCAk.....',
    '.....................kkGIBDk....',
    '.......................kEIDk....',
    '........................kEHFk...',
    '.........................kFHk...',
    '..........................kGIk..',
    '...........................kGFk.',
    '............................kk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The frostfin sturgeon, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Siberian sturgeon.jpg, cut out with rembg, D97).
  'fish/frostfin-sturgeon': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...........kkkk.................',
    '..........kMMMMk................',
    '..k...kkkkMMMMMMk...............',
    '.kEkkkECEGEEEEIMMk.kk...........',
    '..kkFEABLexFIGFDGIkCBk..........',
    '....kkDFIxxDEFHIHHIGDk..........',
    '......kkkDICDEHILIILIDkkkkkk....',
    '.........kCIHHFFJLIHLILILGFFk...',
    '........kABDEFCBCJMkDkkGEkkk....',
    '.........kAACCBBBCFJk..kEk......',
    '..........kkABBBBkkk....k.......',
    '............kkkkk...............',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The silver bream, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Silver bream.jpg, cut out with rembg, D97).
  'fish/silver-bream': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkkkkk...................',
    '.kADBBBBBBBAAkk.................',
    '.kADexDGDDDBCAAkkkkkkkk.........',
    '..kDxxDDDIEEDDCAABAFABAk........',
    '...kFEEDEHGJEDDBCDDDBkk.........',
    '....kGIFDIEMGLEDCDFBk...........',
    '....kGHDFDDEGLMJHDDk............',
    '.....kHHDCDGMMJMMDCk............',
    '......kHGMMGGEGGGLDCk...........',
    '......kGJMMLGJGGMGEDBk..........',
    '.......kDELGGLMMEGGGIEkkkkkkkk..',
    '........kBGHMMGJGMGGGEDCBEDCAAk.',
    '........kAkkDDEBEDDHJDEEBBBAkk..',
    '.........k..kABAkkkkkEDCBkkk....',
    '.............kAAk....kBBBk......',
    '..............kk.....kBCBk......',
    '......................kCBk......',
    '......................kAAk......',
    '.......................kAk......',
    '........................k.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The smelt, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Smelt.jpg, cut out with rembg, D97).
  'fish/smelt': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kDAkkk........................',
    '.kHGDBDAkkk......k..............',
    '..kGEeeGCAAkk...kEk.............',
    '...kEexCBHBBAk.kCBk.............',
    '....kCBBBGGGBAkBBBk.............',
    '.....kkECADGDCCBCBk.............',
    '.......kCEIIHHDECkk.............',
    '........kkJIJJGGBCAk............',
    '..........kkHMIJHECBk...........',
    '...........kEEHJMIHIEkkk........',
    '...........kDGBkMMJJHBBAk.......',
    '...........kIDk.kkEHIHBHk.......',
    '...........kGk....kDACLHBkkkkk..',
    '............k.....kBCBkkIECBCCk.',
    '...................kkk..kHCBkk..',
    '........................kCCk....',
    '.........................kBk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The sterlet, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Sterlet.jpg, cut out with rembg, D97).
  'fish/sterlet': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kk............................',
    '.kCAkkkkkk......................',
    '..kHDBBBAAkk....................',
    '...kkJJEeeAAkk..................',
    '.....kECexHBABk.................',
    '......kkHMMHDABk................',
    '.......kCEMMJDADk...............',
    '........kEkMMLHBk...............',
    '........kEEkEMHDAkkkk...........',
    '.........kk.kMMHDABCBk..........',
    '.............kHMEJDCCk..........',
    '.............kFFDMLJDkk.........',
    '..............kFFkkGDHBkkkk.....',
    '...............kk..kFGJDDEEk....',
    '....................kkkBEkk.....',
    '......................kBEk......',
    '.......................kCk......',
    '........................k.......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The stone loach, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Stone loach.jpg, cut out with rembg, D97).
  'fish/stone-loach': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkk..........................',
    '..kHeekk........................',
    '...kexEAk.......................',
    '....kLIGCkk.....................',
    '.....kLIEBCkkk..................',
    '......kECFCBCAkk................',
    '.......kkGLDDDCAk...............',
    '.........kILJHCAAkkkk...........',
    '..........kkkILHABDDFk..........',
    '.............kkIICCFFk..........',
    '..............kGEIDCk...........',
    '..............kLLkLDCkk.........',
    '...............kk.kMFBCkk.......',
    '..................kILJCBDkkk....',
    '..................kJHLHHCACHkk..',
    '..................kJJkkkkHBEIGk.',
    '...................kk....kkIIGk.',
    '...........................kGk..',
    '............................k...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The taimen, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Taimen.jpg, cut out with rembg, D97).
  'fish/taimen': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkk.........................',
    '..kJHJJkkkk.....................',
    '.kFEexMMMMJkk...................',
    '..kExxFJJHJMJkk.................',
    '...kDEEFFFHHJJMkkkkkk...........',
    '....kkBDFDEEFHJLMJIHFk..........',
    '......kkEEEBBDFHJLMLJk..........',
    '........kkFFAAADEFILGHk.........',
    '..........kHBBAAABEFILkk........',
    '...........kkkBBBAABEHIIkk......',
    '..............kkkBAAADGHLGk.....',
    '.................kEEBABDGIIkk...',
    '.................kFEkkBBBDGIGk..',
    '..................kk..kAAkAGCk..',
    '......................kCCkkCGk..',
    '.......................kk.kCCCk.',
    '...........................kCCk.',
    '............................kk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The tench, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Tench.jpg, cut out with rembg, D97).
  'fish/tench': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkk......................',
    '.kDDBBAAAAkkk...................',
    '.kIHexDCDCCAAkk.................',
    '..kJxxHHHHCCAAAkkkkkk...........',
    '..kJJJIFIHGDEDAAAEEEBk..........',
    '...kJJJMLIGGGGCAAABEBk..........',
    '....kJFMMFHIIGGDCAAEEEk.........',
    '.....kFFMJJJHIIIFCCAkk..........',
    '.....kBBFMJJLMLLIGDCk...........',
    '.....kBAAFJJMMMLLIIFCk..........',
    '......kEkkJJJJILLLLIHCkk........',
    '.......k..kkDFFMMMLLIGDAkk......',
    '...........kBBDHJMMMLIGFCBkkk...',
    '............kBkkHHJMMIGGGGEEBk..',
    '.............k..kkEFFJHGGGEEEEk.',
    '.................kBEBkFHGGEEBk..',
    '..................kBBkkkBEEBBk..',
    '...................kk...kEEBk...',
    '.........................kBBk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The trahira, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Trahira.jpg, cut out with rembg, D97).
  'fish/trahira': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkk.........................',
    '.kDHBDBkk.......................',
    '..kHexLGAkkk....................',
    '..kFxxDGFAAAkk.kkkk.............',
    '...kFDBHFBAAAAkDDDCk............',
    '....kBGFDCDDDBAFDDHCk...........',
    '.....kkIHCCDHDBABDDCBk..........',
    '.......kGCCICDDDBBBBk...........',
    '........kIGIGIHDDBAAk...........',
    '.........kkGMIIIJHDBAkk.........',
    '...........kHHGGIIGDBBBk........',
    '...........kHDDGLGJJCHDBkkkk....',
    '...........kHDGAkGGIGICBBDDHkk..',
    '............kHCk.kkHGGCGHHDHGCk.',
    '.............kk...kFEDkkDDHJCGk.',
    '..................kDCCk.kDCCEGk.',
    '...................kkk...kBCCk..',
    '..........................kkk...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The vendace, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Vendace.jpg, cut out with rembg, D97).
  'fish/vendace': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kk............................',
    '.kADkkk.........................',
    '.kCDDAAkkk......................',
    '..kFFexBABkk....................',
    '...kFxxJDCAAk...................',
    '...kJJJJJHFCAkkk................',
    '....kFFHHHMLFBABk...............',
    '.....kGEHFHMMLFAAk..............',
    '......kEFFDFHMJHAAk.............',
    '.......kkGDBDIJJHFBkk...........',
    '.........kkFBDHMJJHAAk..........',
    '...........kkFFFJMHJHBk.........',
    '.............kkGGHFHJHBk........',
    '...............kkkDFFIHDkkk.....',
    '..................kkkkDFBBCkk...',
    '......................kkBBEFDk..',
    '........................kEDkk...',
    '.........................kDDk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The weatherfish, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Weatherfish.jpg, cut out with rembg, D97).
  'fish/weatherfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kCCkkk........................',
    '..kAAACIk.......................',
    '...kCAeeGkk.....................',
    '....kEexBCIkk...................',
    '.....kDDDDCIIk..................',
    '.....kMFFFFEIIkk................',
    '......kkkHFFHGIIkkkk............',
    '.........kLHHJHGIIIMk...........',
    '..........kkHJJLHGGIkk..........',
    '............kLLJJJDEEIk.........',
    '.............kkLJJJHDCGkk.......',
    '...............kMkMJFFCCCk......',
    '................k.kkFFHECCkkk...',
    '...................kJMkHDBBBDk..',
    '....................kk.kFDBADJk.',
    '........................kkABFJk.',
    '.........................kFFFLk.',
    '..........................kJkk..',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The wels catfish, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Wels catfish.jpg, cut out with rembg, D97).
  'fish/wels-catfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....kkk........................',
    '....kECCkkkk....................',
    '...kBCeeDEEDkk..................',
    '....kDexGEEEDEkk................',
    '.....kMLJHFGFFDDkk..............',
    '......kLJLJHIGGCCBk.............',
    '.......kkHJDGIIHHCAkk...........',
    '.........kkCBILLJHCBAkk.........',
    '...........kGGMLMLJHDAAkk.......',
    '............kkkLILLLIGDCAkkk....',
    '...............kkkGJLJJIGDCBkk..',
    '..................kkCFIHHGEEABk.',
    '....................kkkBAkkkAk..',
    '.......................kk...k...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The yellow perch, from a picture on Wikimedia Commons (docs/design/fish_refs_commons/Yellow perch.jpg, cut out with rembg, D97).
  'fish/yellow-perch': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.............kkk................',
    '............kCCFk...............',
    '...........kAAACCkk.............',
    '....kkkkkkkCDAAAAAAk............',
    '..kkCCCAAAAADBDDCAFk............',
    '.kFCexDEAAADDBADGAAFk...........',
    '.kMLxxEEAAADBDDEEDACk...........',
    '..kMMLGBGGDBBBEEEDEDGkkk........',
    '...kkMMLGLEEDBEHEDEEBEJMk.......',
    '.....kMMLLIJIHIIEEHIDDILk.......',
    '......kkMLLLJJJIBEEIBBBGMk......',
    '........kMMMMLLJEIEBEJBCk.......',
    '.........kLJMMMMLLJHIJEEGkkkk...',
    '.........kHHLkkMMMMLLLLJEDBIJk..',
    '..........kkk..kkkkDACkMLDEEIGk.',
    '..................kBEDkkkIIJLk..',
    '...................kGk..kHIBGk..',
    '....................k....kILLk..',
    '..........................kLMk..',
    '...........................kk...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The giant gourami, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Giant gourami.jpg, cut out with rembg, D97).
  'fish/giant-gourami': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.......kkk......................',
    '..kkkkkAAAkkkk..................',
    '.kHHEDCCDBAAAAkkkk..............',
    '.kJFexGGEEECCBABCEk.............',
    '..kLxxGGEFDDDECBACEkk...........',
    '..kLMLFHDFDEDEDDCBAEEk..........',
    '..kJIMHGEGEDCECECECABDk.........',
    '...kIIIHFFEEEFDEDECDABBk........',
    '...kIHJIEHILFEEEDDDFBAAAk.......',
    '....kIJJHJIIIIEIDEDFCCBBBk......',
    '....kHIJHHIJJIHJFGDEEFBBDAk.....',
    '.....kGIJILHHHGFHGEFDFECCkkk....',
    '......kELIIHIEIGHFHEFGEDCBBBkk..',
    '.......kGJHIHFHGHFGHGEGCDBABBBk.',
    '........kFHGHJIGJGMHGFECDBBBBBk.',
    '.........kHHIIIHILJIGGEEDBBBBBk.',
    '..........kHFGIIHFJHGCBFCDCBBk..',
    '...........kkEDFFDDBBACDGEEFEk..',
    '.............kkkDEEDEFFEEEGEk...',
    '................kGGEFDGGFkkk....',
    '.................kkkGFkkk.......',
    '....................kk..........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The peacock bass, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Peacock bass.jpg, cut out with rembg, D97).
  'fish/peacock-bass': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkkkk.....................',
    '.kHHFFCBAAAkk...................',
    '.kGEexDDDCCAAkk.................',
    '..kExxDEDEFBAACk................',
    '..kGEGFGDCFBBBCBkk..............',
    '...kGHHHEIEDBGEEBAk.............',
    '....kEEEGECEEIGECAAk............',
    '.....kGFEGHIIGELCBCAk...........',
    '......kkFGIIGILGBFECk...........',
    '........kFHLMMIEGLHEEkkk........',
    '.........kkHLLJGMLHGCABCk.......',
    '...........kJIIMLLIFCBCCkk......',
    '............kkLIMMLIEEEEECk.....',
    '..............kGHLLILGFEBkkkk...',
    '...............kkkGFFHEHEBDDDk..',
    '..................kkkkFFECDECEk.',
    '......................kkCDBCCEk.',
    '........................kEEDCEk.',
    '........................kFEFEk..',
    '.........................kkkk...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The silver arowana, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Silver arowana.jpg, cut out with rembg, D97).
  'fish/silver-arowana': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkk.........................',
    '..kMLLJkkk......................',
    '.kJMexLJJIkk....................',
    '.kLLxxJIIIIGkk..................',
    '..kkLJIGFFGIIGk.................',
    '...kJJGFEEEGJJJkk...............',
    '....kGGEDEFGIJJJJkk.............',
    '.....kFFEEFGIIJJJJEk............',
    '......kEEEFGGGIIIIIJk...........',
    '.......kkEEFGGGGGGGGFkk.........',
    '.........kEFFGGFFEEEEFIk........',
    '..........kCEFGFEEDDDDDIkk......',
    '...........kkEEFEEDDCCCCEDk.....',
    '.............kCCDDDCCCCBGLMk....',
    '..............kkkBBBBBBCHHEIk...',
    '.................kkBBBBCHDABFk..',
    '...................kkkBBAAAAABk.',
    '......................kkAAAAAk..',
    '........................kkAAk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The clown knifefish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Clown knifefish.jpg, cut out with rembg, D97).
  'fish/clown-knifefish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkkk....................',
    '..kAAAACDEFFkk..................',
    '.kCBeeACDEEEEHkk................',
    '.kDAexBDCDDDEFFJk...............',
    '.kHGEEBEEEEEEEEFMk..............',
    '..kHIIEGGGEDEFFFHMkk............',
    '...kJEGIIIGGEDEHHJCBk...........',
    '...kMLBGLIIIIHFFHHJCk...........',
    '....kkLGLLLLLLHFFFJMk...........',
    '......kEGLLLLLIIGEFMMk..........',
    '.......kCLLLLLLLIEFFMk..........',
    '........kJLIILILIIGFHMk.........',
    '.........kGDGGELLLIFFMk.........',
    '..........kkCIIIBLLIDFMk........',
    '............kDEILILIDDJk........',
    '.............kDEIELIHDDJk.......',
    '..............kEEIICIGDFk.......',
    '...............kCDHIGAECFk......',
    '................kEEDEDEBBFk.....',
    '.................kkDBBBBBBFkk...',
    '...................kBBAAAAADDk..',
    '....................kkBBAABCCHk.',
    '......................kkkBDEDk..',
    '.........................kkkk...',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The mudskipper, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Mudskipper.jpg, cut out with rembg, D97).
  'fish/mudskipper': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkk..........................',
    '..kGDFk......k..................',
    '.kFBeeGk.kkkkFkkk...............',
    '.kFDexIEkDEBDDDEDk....kkkk......',
    '..kEGIFECGDFDDBEDDk..kAAAAk.....',
    '...kHGEGEEBDGGFFFDFkkAAAAAAk....',
    '....kkkFIGFCBBDGGFFkAAAAAAAk....',
    '.......kkGGGGFCBCGkkDDDBBAAEk...',
    '.......kFGLHLIGFCBBEFFEEDBADk...',
    '........kGLIHLGGGECBDFGGEDDk....',
    '.........kILLIILHHFBBBFGGFk.....',
    '..........kkIIGLIIDFGFBCBkk.....',
    '............kkkkLIDGHHHFCBDk....',
    '................kLFHGFCFHHCBk...',
    '.................kHHGGCGLLHHCk..',
    '..................kILIGFIIIIHHk.',
    '..................kGIHHEEFLHHIk.',
    '..................kIHGHkIFHIHHk.',
    '..................kLHLk.kkLLIHk.',
    '...................kkk....kkkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The ornate bichir, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Ornate bichir.jpg, cut out with rembg, D97).
  'fish/ornate-bichir': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....kkkkkk......................',
    '...kBBFEEJkk....................',
    '...kkBBCexFJkkk.................',
    '..kBAkkBxxFEJMJk................',
    '...kAABBBBCDFFJMkk..............',
    '....kkAACBCFHFJJFJkkk...........',
    '......kkABBFLLHJHHJEBk..........',
    '........kBCJLLLJHCFEJCkk........',
    '.........kCBFJLLJHFGFFCCk.......',
    '..........kkkCCGJMJGFFGECk......',
    '.............kkkCEGIIFFFFDk.....',
    '................kkkDEEGFJCCk....',
    '...................kkCCGFFCBk...',
    '.....................kCDGHFBk...',
    '......................kkDFHGk...',
    '........................kFHICk..',
    '.........................kEIIk..',
    '..........................kEJEk.',
    '...........................kECk.',
    '............................kk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The blackfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Blackfish.jpg, cut out with rembg, D97).
  'fish/blackfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....k...........................',
    '...kBkkk........................',
    '..kHHAAAkk......................',
    '..kJFexBBAkkk...................',
    '...kFxxBCAABAk..................',
    '....kDFFJCEBBAkk................',
    '.....kkFJFFCECAAkk....k.........',
    '.......kCHJDCBDAAAk.kkIkk.......',
    '.......kADFFJFCBEBBkFHFDFk......',
    '........kkBFFFCCBCBABHJEEk......',
    '..........kkHMHHBEBDAFHFFk......',
    '............kkMHCEFFECBkkk......',
    '..............kBCCHFCJHEBBkkk...',
    '...............kkBEBDFFFBCBABk..',
    '................kDHFCACEDCDFBBk.',
    '................kCHDFkkFCEFHECk.',
    '.................kIDCBkkBBCHBBk.',
    '..................kCCk..kBCBCk..',
    '...................kk....kCAk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The marbled lungfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Marbled lungfish.jpg, cut out with rembg, D97).
  'fish/marbled-lungfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kEk...........................',
    '.kBBHk..........................',
    '..kAFIk.........................',
    '..kBAGJk........................',
    '...kABHLkk......................',
    '....kDCGLLkk....................',
    '.....kACexMLkk..................',
    '......kAxxHLMMkkk...............',
    '.......kAABFHJMLGkkk............',
    '........kkBBCDHJLLHEkk..........',
    '..........kkkDDEFHHMJEkk........',
    '.............kkkCEFFGHGBkk......',
    '................kkkDDEFGEEk.....',
    '...................kkkkEGEEk....',
    '.......................kkkkGk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The electric eel, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Electric eel.jpg, cut out with rembg, D97).
  'fish/electric-eel': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '......kk........................',
    '...kkkGGkkkk....................',
    '..kFGHexIHHHkk..................',
    '..kELMxxHHGHHFkk................',
    '.kEJIFAABBEEGILLk...............',
    '..kkEkkCkkAABEFJMkk.............',
    '....k..k..kAAABEHMGk............',
    '...........kkkBBDFLMkk..........',
    '..............kBBCELMGk.........',
    '...............kBBCEHMMkk.......',
    '................kkCCDFIMLkk.....',
    '..................kCCCEHJLGk....',
    '...................kkkCDFHJLk...',
    '......................kkDDEFJk..',
    '........................kkkkDk..',
    '............................k...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The arapaima, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Arapaima.jpg, cut out with rembg, D97).
  'fish/arapaima': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kk............................',
    '.kGHkkkkkkkk....................',
    '.kEGHIIIILJLkkk.................',
    '..kCEEexHIJLMMLkk...............',
    '...kkCxxGHHJJJJMMkk.............',
    '.....kCHDDGIHGJLMMLkk...........',
    '......kIICCCFEHJJLMMLk..........',
    '.......kLGCCACFHIIJLLMkkk.......',
    '........kIkkBABDGGHIJLLMIk......',
    '.........k..kBBADDGHJJJJLIk.....',
    '.............kkAADDFHIIIIJFk....',
    '...............kABBDEFHIHHHEk...',
    '................kAABDEFHHGIEEk..',
    '................kBAABEEFGFFFDk..',
    '.................kkAABDEFEFBBDk.',
    '...................kAAADEDDBBDk.',
    '....................kAEDEDBBBk..',
    '.....................kBEFDEkk...',
    '......................kkEEk.....',
    '........................kk......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The strange tilapia, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Strange tilapia.jpg, cut out with rembg, D97).
  'fish/strange-tilapia': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkkkkkk.................',
    '..kCDEGJMMLLFGIkk...............',
    '.kBDexBCDJMMMIEFIkk.............',
    '.kAAxxAABDJLLMJHDGHk............',
    '..kAABCBADHJJLLMJEFHk...........',
    '...kABCIBDGIILJLLJFEFkk.........',
    '....kAEAAEDFIJJJLIIEEEIk........',
    '....kAACFEDDEHHHIIJIFEEIkk......',
    '.....kECLIHFDCFHIIIJHHFFIHk.....',
    '......kBCEFEBCDEGHJJLHFFFk......',
    '.......kBBBBCBCCDFFHIJkkkkkkk...',
    '........kDCBBCCCCDCDHGLMGMJIGk..',
    '.........kkBDBBABBABCEFJHMJIHFk.',
    '...........kkDCAABBCCBCEILIHHk..',
    '.............kkIHMILJEADLJHHGk..',
    '...............kLMMLLHkLJHFHk...',
    '................kMLLLkkIIGHk....',
    '.................kJJIk.kHGGk....',
    '..................kkk..kEGk.....',
    '........................kk......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The oscar, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Oscar.jpg, cut out with rembg, D97).
  'fish/oscar': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....kkkk.kkk....................',
    '...kJJJJkGCCkkkkkkk.............',
    '..kJGEEGGCAAAACCCCGkkk..........',
    '.kJGeeEEGCAAAAACCCCCGGkkk.......',
    '.kGGexEBEGAABBEEECAACCGJJk......',
    '.kGEBBFDDDBDBADDDAAAAAACGJk.....',
    '..kEBBBFFFFDFAHHHBABAAAAACJk....',
    '..kGBBBFIFFFFDIIIAAAABACCCGk....',
    '...kEBBHHIILFFILHEBHFFBCCBAGk...',
    '....kkHDDDFIILLLJGGHBFHEGGGGGk..',
    '......kDDDFIILFHLHEBHIHHGGGGJJk.',
    '.......kDDDDIMIILLHDIILLHJJJJJk.',
    '........kkkDHLMMMMLIILLMMMMMkk..',
    '...........kkkkkkHDHLMMkkkkk....',
    '...............kABEkkkk.........',
    '................kkk.............',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The red-bellied piranha, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Red-bellied piranha.jpg, cut out with rembg, D97).
  'fish/red-bellied-piranha': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....kkkkkkkk...................',
    '..kkkDHHHDDDDkk.................',
    '.kDBDDGIGDGHDBBkk...............',
    '.kGeeGEEGIGLIGDDDk..............',
    '.kJexGECEIGGLLLHHHkkkkk.........',
    '..kJIIIIEIGLGLLLHHHBAAAk........',
    '..kJIIIIEEEIIILMLLMHAAAk........',
    '...kFIEEEEEEEILMLLMMBAAk........',
    '...kFCIEEEEEEELLLLLMHAAk........',
    '....kFCCEEEEEEGLLLLMMDAk........',
    '....kFGCCEEEEEEIIILLMMk.........',
    '.....kFGCEEEEEEEIIGLLMk.........',
    '......kFFFEEIEEIIIILILMk........',
    '.......kFFFFIJIIIIIILLLMkkkkk...',
    '........kkCFJJJJIIIIIIGLMHDBBk..',
    '..........kkFJJJJJJJIGGGGDBAAAk.',
    '............kkFFFFCCCCkGDBAAkk..',
    '..............kCCCAkkkkBBBAk....',
    '..............kCCkk...kABBk.....',
    '...............kk......kBBk.....',
    '.......................kBAk.....',
    '........................kk......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The pacu, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Pacu.jpg, cut out with rembg, D97).
  'fish/pacu': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....kkkkkkkk...................',
    '...kkIJMMMJJJkk.................',
    '..kJJMJJMIMMJJIkkk..............',
    '.kJDexIJMJMMMJJIIFk.............',
    '.kLLxxDLJJIJMJJJJJDk............',
    '..kHGDBLJIIIMMMMJIFBk...........',
    '..kHHGFLLIDJFIJMMMIBBk..........',
    '...kLHHCGDIIFFIJMMJBk...........',
    '...kHHACCCDFFDIIJJJMJk..........',
    '....kHACHCFFFFFDFIDJJEk.........',
    '.....kCACHGGFDIDFDBIIJk.........',
    '......kCAHHGGFFFFFFIIIIkkkkk....',
    '.......kLLHHGGFJIFDJFFIIDEEBk...',
    '........kkCHHGIJIDDFDBFIFDEBBk..',
    '..........kkCGFFIFDDAAFFDBAAAk..',
    '............kkkkDDCBAkkFEAAkk...',
    '...............kCCAAk.kBEAk.....',
    '................kAAk..kEIBk.....',
    '.................kAk...kEAk.....',
    '..................k....kEAk.....',
    '........................kBk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The discus, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Discus.jpg, cut out with rembg, D97).
  'fish/discus': [
    '................................',
    '................................',
    '................................',
    '..........kkkkkkkkkk............',
    '........kkMMMMLLLLLLkkk.........',
    '......kkMMMMLLLLIIHHILLk........',
    '....kkMMJJJLLLLIIIHHHHHIk.......',
    '...kMMMJJIIIIIIIIIIIHHHIIk......',
    '..kMexJIHHHGHHHIIIIIIHHIJJk.....',
    '.kIJxxBIGGGFGGGHHIIIJIIIJJk.....',
    '.kJHGCBCDHGFFFFGHHIIJIIHIJJk....',
    '.kCDDCBBCDDDDFFGGHIIIJIIIIIk....',
    '.kBCCBBBCDDDDDFFGHHIIJIIIJJIk...',
    '.kBBBBBBBCDDDDEFGGHHIIIIIJJJk...',
    '.kBBBBBCBCCDDDDFFGGHHHIIIJJJk...',
    '.kBBBBLCBCCDDDDDFFGGHHIIIJJJJk..',
    '..kBBBBLBBCDDDDDEFFGHHIIJJJJJk..',
    '..kABBBBBBCDDDDDEEFGHHHIJJJJJk..',
    '...kBBBBBCDDDFFFFFFFHHIIIJICLk..',
    '....kBBCCCDDFFGGGFFFGHJCBLkkk...',
    '.....kBBCCDDFGGGGGGGGHJCBAAAAk..',
    '.....kBBCCDDDFGGGGGGGHHBAAAAAAk.',
    '.....kBCDDDDFFFGGGGGHCBAAAAAkk..',
    '......kCEEEFFGGGGGGGGAAAAAAk....',
    '......kBDEEFFFFFFFGGCkAAAAk.....',
    '.......kBDDEEEFFFGGDBkAAAk......',
    '........kBBCDEEEDCCBBBAAAk......',
    '.........kkAAAAAAAAkkLkkk.......',
    '...........kkkkkkkk..k..........',
    '................................',
    '................................',
    '................................',
  ],
  // The electric yellow cichlid, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Electric yellow cichlid.jpg, cut out with rembg, D97).
  'fish/electric-yellow-cichlid': [
    '................................',
    '................................',
    '....k...........................',
    '..kkAkkkkk......................',
    '.kHLLLLMCCkk....................',
    '.kBexJAAJLMCkk..................',
    '.kBxxIBBGJJLMAkk................',
    '.kAEBBBBEGJJLMLCk...............',
    '..kABBBBBEGJJJMHBk..............',
    '..kABBBBBBEGJJJMHAk.............',
    '...kABBBBBBEGJJJMHAk............',
    '....kABBBBBEGGJJJMEAk...........',
    '.....kFBBIBBEGGJJJMEAk..........',
    '.....kAEBBFFEEGGJJJMBAk.........',
    '......kkBBBCBEGGGJJLLAAk........',
    '.......kBEBBBEEGGGJJLHAk........',
    '........kBFBBBEEGGGJJLBAkk......',
    '........kACMEEEEGGGJJJJFACk.....',
    '.........kCADFEEEGGHJJHCAAk.....',
    '.........kDkkkBEHHGGGJLDAkkkk...',
    '..........k...kAEHHGGGJLEELCAk..',
    '...............kACFCGGGJJJIIFCk.',
    '................kADDAGJJJIFFCk..',
    '.................kDDDkGJIFFCAk..',
    '..................kDkkEJIFFAk...',
    '...................k..kJLECk....',
    '......................kBFFAk....',
    '......................kACAk.....',
    '.......................kkk......',
    '................................',
    '................................',
    '................................',
  ],
  // The lumpfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Lumpfish.jpg, cut out with rembg, D97).
  'fish/lumpfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....kk.........................',
    '....kLJk........................',
    '...kLJJk...kk...................',
    '..kMLJHGk.kMJkk.................',
    '..kLexHFkkLJHFDkkkkkkk..........',
    '.kMJxxGDDkJHEDCCFGEBBCkkk.......',
    '.kJIIGGGDGGECCCDDFECCBCFCk......',
    '.kIIIGHHGGGFFEDCDFDCBBBFCEk.....',
    '..kkkkkJIHGGGFEECBDCBBACAABk....',
    '.......kLJHHHGGDFDCDCCBAABBk....',
    '......kMJJLIGGEDDDDDDDDCAAAAk...',
    '......kLIJLJHHFFDCCCEDDFBAAAk...',
    '......kJHIJLJJHGGGDBCCDDCAAAk...',
    '.......kkkkJLJJJIIHFCBBCCDBADk..',
    '..........kJMLLMMMJHFDBBCEDCDk..',
    '...........kLMLMMMMJIGEBCFECDDk.',
    '............kLMMMMMLIHFGEDCBDCk.',
    '.............kkLLLMMJIGGHECBAEk.',
    '...............kkLLLJIHIIECBADk.',
    '.................kLJIIHIIGECCk..',
    '..................kkkkHIIHFEk...',
    '......................kkkkkk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The frontosa, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Frontosa.jpg, cut out with rembg, D97).
  'fish/frontosa': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '........k.....kkkkk.............',
    '......kkLkkkkkEHHEFkk...........',
    '.....kLIILLMIHDDDEFFHk..........',
    '....kIexHILLLLHLIEDEEHk.........',
    '...kkFxxFIIIIIILIEDCEEFk........',
    '..kMLHFEHHHHFFHLLHFCBCDFk.......',
    '.kLIIIFABFHHEEDLLHHHDIDEHk......',
    '.kLLILHBBDFHCCCMIFHHHLEBDEkk....',
    '..kIIIIBBDFDCCDLDEFFHLEBACEEk...',
    '...kJIDBCHFDBBEHDDFFLLEDBACFEk..',
    '....kJDBDLFBCDIHEFFFLIEDCCBDFIk.',
    '.....kCCIIDBBFIFDDDCLHDDEIBBCk..',
    '......kJJFBABIIDDCBIICCCIHAACk..',
    '.......kJJGAALLCBACMIBBBICEBk...',
    '........kkkkkJFAABILEBBCCABIk...',
    '.............kkAAELHCAAHAAAk....',
    '...............kAGGAAAEEAAk.....',
    '................kkGBAABBAAk.....',
    '..................kkGEDDCk......',
    '....................kJIHDk......',
    '.....................kkIk.......',
    '.......................k........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The wolffish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Wolffish.jpg, cut out with rembg, D97).
  'fish/wolffish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkk........................',
    '..kBCECCkkk.....................',
    '.kAAeeGFFFBkk...................',
    '.kAAexGHGCABEkk.................',
    '..kADFHHDDACCCDk................',
    '..kABCFHBCDGAABCkkkkkk..........',
    '...kABDDBAHCDACABBBFGFk.........',
    '....kkABCDCAAHCADBCABECkk.......',
    '......kkACBAGBBHDGEGCDGGHk......',
    '........kADDDBCDGEFFFGGFFGk.....',
    '.........kCCDEFFGGFEFFGFFEDk....',
    '..........kGIIIJIIJIFGFFFFEDk...',
    '..........kHJJJJLLLMMMHDDFECkk..',
    '...........kIMLMMMMMMMMLHDBBAAk.',
    '............kkHIIMMMMMMMMIkkkk..',
    '..............kGJLMMMMMMMIk.....',
    '...............kkLLMMMMMMIk.....',
    '.................kLMMMMMMIk.....',
    '..................kkMMMMMMk.....',
    '....................kkMMMMIk....',
    '......................kkIJLk....',
    '........................kkk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The strange cod, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Strange cod.jpeg, cut out with rembg, D97).
  'fish/strange-cod': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkk..........................',
    '.kDAECkkkkk.....................',
    '.kAAexBAAAAkk...................',
    '..kCxxBDABBAAkk.................',
    '...kABADGBBAAABkk...............',
    '...kBEDADCDBBAEADk..............',
    '....kDEGDDAAAGEABBk.............',
    '.....kBADDAABEEBBABkkkk.........',
    '......kAAAABBBEDDEBDCDMk........',
    '......kBDABBBEBGBBIICAGGk.......',
    '......kEkABDDEGLEJDIBDGMk.......',
    '.......k.kkDDGGEJGMEDEGIIk......',
    '...........kkkkIIIIDDHABkkkk....',
    '...............kkIIEJDBEBBAAkk..',
    '................kJDJACDBDAAADAk.',
    '.................kEGDBkBDCAGEFk.',
    '..................kEkk.kACGFBk..',
    '...................k....kDEEDk..',
    '.........................kDDk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The barramundi, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Barramundi.jpg, cut out with rembg, D97).
  'fish/barramundi': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '......kkkkkk....................',
    '.....kAAAAAAkkk.................',
    '....kAAAAAAAAAAkk...............',
    '...kAeeBDDDDCCBBBkk.............',
    '..kDCexEEEFEEEDDCCBkkk..........',
    '..kFFGIFFGHGGGGEEDECBCk.........',
    '...kIJJJIHHHHIHGHFFDDDDk........',
    '....kkHJJLIIIJLHHHGGDDCDk..k....',
    '......kkHHLLLLLLLGLLGFDDkkkDk...',
    '........kkkIIIJLLLMMMMLGFFEDCk..',
    '...........kkkkkLHLMMMMMLECCCCk.',
    '................kkIHGEEIGDDDDDk.',
    '..................kkkkkkkECCCk..',
    '.........................kkkk...',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The polar cod, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Polar cod.jpg, cut out with rembg, D97).
  'fish/polar-cod': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkk..........................',
    '..kBBDkkkk...kk.................',
    '..kDeeCAABkkkHMk................',
    '.kFDexFDBBBBFHHk................',
    '..kkFFCFHFCAAGLk................',
    '....kGGGIBABCAEk.kk.............',
    '.....kJJJFBACFBCkMHk............',
    '......kIIIDBADHDCFMk............',
    '.......kkJIBBDHLGBGk............',
    '.........kJGEIGFHHCk............',
    '..........kkJJJIGELFkkk.........',
    '............kkIJIGJLFCCk........',
    '..............kHHGkGLHBDk.kkkk..',
    '...............kkkkLGELGkkDDDEk.',
    '...................kJHGkHDEEEk..',
    '....................kkk.kCEGk...',
    '........................kBDEk...',
    '.........................kEEk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The strange perch, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Strange perch.jpeg, cut out with rembg, D97).
  'fish/strange-perch': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.........kkkk...................',
    '.....kkkkAAAAkkkk...............',
    '..kkkFCDDCDBBBBAAk..............',
    '.kHMLexLHGGEEEDDAAkkkkk.........',
    '..kMMxxLMMLCGGEEEBAACCAk........',
    '...kkJMMMLLDEJJEEECAACCDk.......',
    '.....kHLLLLGGGJJGGEDBACCBk......',
    '......kkFJLHJLLMLGGEEBBCk.......',
    '........kkBHJLLLLLJGEGBAkkkkk...',
    '.........kHBBCHHHJJHGGEECCEIIk..',
    '..........kBBkkkkFDHHHGGGGEFFLk.',
    '...........kk....kBBEBABJJFIFFk.',
    '..................kBDGAkkFCIIFk.',
    '...................kkkk..kCIFk..',
    '..........................kIk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The goliath tigerfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Goliath tigerfish.jpg, cut out with rembg, D97).
  'fish/goliath-tigerfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '......kkkkkkkkkkk...............',
    '..kkkkLJLLLMMMMMLkkk............',
    '.kGGLLMLJJLLLLMMMMMMkk..........',
    '..kHDexLJGGJJJJJLLLLLMkk........',
    '...kIxxHGDFDGGGJJJJJLMMLk.......',
    '....kIHHHGFHFBDDGGJGJJLLLkkk....',
    '.....kkIEFFFHFFBBBDDDGJJLLLJk...',
    '.......kkkIHFFHHHCBBBBDGGJLGkk..',
    '..........kIHFEFFHECCCBBBDDJLGk.',
    '...........kkkHFHHFEFFFEEECBDBk.',
    '..............kEHACEFEEFFHICkk..',
    '..............kIICAACEEFHCCCAk..',
    '...............kIIAACIFFCCACCk..',
    '................kIFHAIHHFFCCCk..',
    '.................kkkACCCIIIHAk..',
    '....................kkkAACAAk...',
    '.......................kkAAk....',
    '.........................kk.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The goonch catfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Goonch catfish.jpg, cut out with rembg, D97).
  'fish/goonch-catfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kBkkkkk.......................',
    '.kCDBBAFBkkkkk..................',
    '..kBBBeeBBBDLCk.................',
    '..kCBBexADEBGLk.................',
    '...kLkBBBCBBAkk.................',
    '....k.kFCBBAABHk................',
    '.......kLCADIDFGkk..............',
    '........kBkGFMGFBGk.............',
    '.........k.kDkMBAAk.............',
    '...........kBkkEFIGkkkk.........',
    '............k..kGCIIDBLkk.......',
    '...............kBkkHIAFIIk......',
    '................k..kkCBkk.......',
    '.....................kBk........',
    '......................k.........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The snailfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Snailfish.jpg, cut out with rembg, D97).
  'fish/snailfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkk...........................',
    '.kCEEkkkkkkk....................',
    '..kACCEEEECCkkkk................',
    '...kkBCCexEIEIEIkk..............',
    '.....kkCxxCCELMMLEk.............',
    '.......kBBBCCCGMMLCkk...........',
    '........kBBBCCFFJMMLEkk.........',
    '.........kBBAADFFFJMMLCkk.......',
    '..........kkDAADFFFGLMMJDk......',
    '............kAADDDFFHJLMLGk.....',
    '.............kkAADFFHHHLMMJk....',
    '...............kkkAFHHHHHJMGk...',
    '..................kkAHHHHJFJCk..',
    '....................kkAFFFFJCk..',
    '......................kkADDDCk..',
    '........................kADFDEk.',
    '.........................kkDFCk.',
    '...........................kkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The giant freshwater stingray, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Giant freshwater stingray.jpg, cut out with rembg, D97).
  'fish/giant-freshwater-stingray': [
    '................................',
    '................................',
    '.......kk...kkkkkkkkkkkkk.......',
    '.....kkIJkkkLMMMMMMMMMLMLkk.....',
    '....kHHHLMMMMMMMMMMMMMMLMJJk....',
    '...kIFJLLJLMMMMMMIJMMMMMLLIIk...',
    '..kFFHHJJJMMHJLLLIILMMLJLJIIJk..',
    '..kHGFJJLLMMLJLLLJLJLLJJJIJIGk..',
    '..kGHHJLLLLJIIJJIIJJJJIHIJFILJk.',
    '..kEGIIIJJJGEHHHGGFHIIHGHHGGIFk.',
    '.kEeeHIIGJIHGFHGFFGHIHGEEGEDGDk.',
    '.kIexEHIHJJIHHHHGFFIHHGEGDDDGGk.',
    '.kFECDHGFIJHHGGHGFHHGGFEDEDCIk..',
    '.kEFCCEEFHIJHGFEGFHFGFEECCCBIk..',
    '.kGFDBCDEFFHIGFFGGHFEFEDCBBEk...',
    '..kFCBBCCDFFEFFGGGFDEEDCBBBGk...',
    '..kFCAABBDEDCDFGGFGGFDBBBABHk...',
    '..kEDAAACCDBDGGGGEDDECAAAADk....',
    '...kDAAABDBDGFFGFEEBABAAABGk....',
    '....kBAAABDFDDEFFFFBAAAAAEk.....',
    '....kDBAACDBBDFFFEFBAAAACFk.....',
    '.....kCBBBAAACDEDDCBAAAAGk......',
    '.....kCCAAABBBBDDCBBAAADk.......',
    '......kECABBCABCDCBBAADDk.......',
    '.......kEDAAAAACEDBAkCDk........',
    '........kkCBAAACECABkkk.........',
    '..........kkkkkDEBkk............',
    '..............kEFk..............',
    '..............kDDk..............',
    '...............kk...............',
    '................................',
    '................................',
  ],
  // The icefish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Icefish.jpg, cut out with rembg, D97).
  'fish/icefish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '..kk............................',
    '.kCEkkk.........................',
    '..kEFELkkkkkk......kkk..........',
    '...kDFJMIDBCJkk...kBAAk.........',
    '....kGCexLCFGJGkkkBDBCAk........',
    '.....kIxxIHJFIJFCBBBBBk.........',
    '......kJFBBCDGLCFEBBBk..........',
    '.......kMIDBAGJEBEDFkkkkk.......',
    '........kIMIEJGCBJMLGBCCCk......',
    '.........kFIGLMEJDEFDBACBDk.....',
    '..........kGEMMDBEEDBBCEDHCk....',
    '..........kDEIDDFDFGBBBMEGGFk...',
    '..........kBBkBBDDDBGBAJFLJEGk..',
    '..........kBBkkkABBDBBBLLIADDk..',
    '...........kBk..kkkCDFLJLBACDDk.',
    '...........kAk.....kkCDGLDGCCFk.',
    '............k.......kBDBDIGFCk..',
    '.....................kCBDCJFAk..',
    '......................kkBBBAk...',
    '.......................kCCAAk...',
    '.......................kDCAAk...',
    '........................kBAk....',
    '.......................kBAk.....',
    '........................kk......',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The coelacanth, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Coelacanth.jpg, cut out with rembg, D97).
  'fish/coelacanth': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....kkkkk.......................',
    '..kkGGFFHk.kk...................',
    '.kIGexFHIHkIHk..................',
    '.kGFxxHHFHJJJJk....k............',
    '..kFBDDHHHGJJHLkk.kGk...........',
    '..kDFDFDDFFHIHLJJkkGHk..........',
    '..kIHFDBDDDDFHIJLLJGHk..........',
    '...kkFBBBBBBDFGIHJJLJFk.........',
    '.....kkBAAABBBEGGIJJLJkk........',
    '......kDAAABBBADEEIIJJMLk.......',
    '.......kkkkkBBBBDEEEGIJLMk......',
    '...........kFDBBBDDEDEILMMkk....',
    '............kBDFGFFFFFCIJLLLk...',
    '.............kkkkFFFFGECIIJMMk..',
    '.................kkBBBBCEDJJJk..',
    '...................kkBBDDEILHJk.',
    '.....................kkFFDGJLk..',
    '.......................kkkkFk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The strange shark, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Strange shark.jpg, cut out with rembg, D97).
  'fish/strange-shark': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....k...........................',
    '...kAk..........................',
    '...kAk..........................',
    '...kCBk.........................',
    '..kBCEkk........................',
    '.kABBDDCkkkk....................',
    '..kkkkCEGCAAkkk.................',
    '......kkDJexFBAkkkkk............',
    '........kDxxJJJCBAAAk...........',
    '........kAHJJJJJJHBAk...........',
    '.........kCDJJJJJJJGBkk.........',
    '..........kkCJJJJJJJFDAk........',
    '............kCJJJJJJJJFBk.......',
    '.............kCHJJJJJJJGCkk.....',
    '..............kBFGJJJJJJHEAk....',
    '...............kkCFHJJJJJHCAk...',
    '.................kACFEIIJJJBAk..',
    '..................kCFCCBBJJBAAk.',
    '...................kkkkCCCBCkk..',
    '.......................kkkkk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The hillstream loach, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Hillstream loach.jpg, cut out with rembg, D97).
  'fish/hillstream-loach': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '.....kkkk.......................',
    '....kIJJJkkkk...................',
    '..kkIIHIJJJJLkk.................',
    '.kGFeeHEGFHIJJMkk...............',
    '.kGDexCBBDDFHHJJJkk.............',
    '..kBBAABDBDDFHHIJLIk............',
    '..kAAAACBBBDDDFFIJIIkk..........',
    '...kACAAABBDDBBDEHIIIJk.........',
    '....kBAAAABFHHFDBEGIIIIk........',
    '.....kAAAAACFHHFDBEGIJJkk.......',
    '......kAACAACGHDDBBEEGIJMk......',
    '.......kACAAACEDFDBCCEEHLMk.....',
    '........kECCACCDFHICCCCEGILkk...',
    '.........kkEEBDBFHIHEECEEEGLJk..',
    '...........kkkkFFHHIIkkGGEGLLJk.',
    '...............kGFHHk..kkIILMMk.',
    '................kkkk.....kkLLMk.',
    '...........................kkk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The snow trout, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Snow trout.jpg, cut out with rembg, D97).
  'fish/snow-trout': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kCAkkkk.......................',
    '.kADBEBAAkk.....................',
    '..kBGHexAAAkk...................',
    '...kFDxxBAAAAkkkkk..............',
    '....kkGFGBBAAAADDCk.............',
    '......kEHFFCBBABFEk.............',
    '.......kAFIGDFDACEk.............',
    '........kkEIGHBEAAk.............',
    '..........kCEHIHECBkk...........',
    '...........kBIMIGCABAk..........',
    '...........kBEkHCHHDECkk........',
    '............kDkkkFEEEDDCkkk.....',
    '.............k...kEEDFDGCCDkk...',
    '..................kIkkDFBCGIHk..',
    '..................kLMkkCCCHkk...',
    '...................kk..kkDFk....',
    '.........................kFk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The golden mahseer, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Golden mahseer.jpg, cut out with rembg, D97).
  'fish/golden-mahseer': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '....kk..........................',
    '..kkAAkkkk......................',
    '.kCEexDBABkkk...................',
    '.kEFxxIDDEJCBkk.................',
    '..kBFLHHHEEGJEBkk...............',
    '...kkEILFCFFEJFCBk..............',
    '.....kFGCEFGGFLGCBk.............',
    '......kEEDFEGIJJFDBk............',
    '.......kFEDFJJMMIIDBk...........',
    '........kCEJMMMJMLHDBk..........',
    '.........kkkJLMMJLMLDCk.........',
    '............kkFGJJJMLICkkkkkk...',
    '..............kCEGIJMLDCBCCCCk..',
    '...............kkkCCBELJDCBBBk..',
    '..................kCBkkFFBBkk...',
    '..................kBAk.kkBAk....',
    '..................kABk...kBk....',
    '...................kk....kABk...',
    '..........................kBk...',
    '...........................k....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The redtail catfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Redtail catfish.jpg, cut out with rembg, D97).
  'fish/redtail-catfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkkkk.......................',
    '.kHGJHHHGkkk....................',
    '..kkHGexGHJHkkkkkk..............',
    '....kHxxDDGHJHCCGMk.............',
    '....kLLFFHFFHHDBCHk.............',
    '.....kCCFJLJDFHBBGk.............',
    '.....kDBBBHMLDDCBDk.............',
    '......kHBBDJLLFCCGkk............',
    '.......kkkkCDHMJCDFDkk..........',
    '..........kAAADLLHDDBCk.........',
    '..........kAAAkFJMLGCBk.........',
    '..........kBAAkkkCHLHGkkk.......',
    '...........kAk..kAADJLHDIkkkk...',
    '............k....kAACHJHEEIIIk..',
    '.................kAkkDDEIILLIk..',
    '..................k..kEEIIkkk...',
    '......................kEkk......',
    '.......................k........',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The tiger shovelnose catfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Tiger shovelnose catfish.jpg, cut out with rembg, D97).
  'fish/tiger-shovelnose-catfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kk...........................',
    '..kABkkk........................',
    '.kADDBBAkk......................',
    '..kDFEeeBBkk.kkk................',
    '...kCCexHFAAkGGMk...............',
    '....kkCEEFEACEIJJk..............',
    '......kBBFHFCCAIk...............',
    '.......kkIMMHECAk...............',
    '.........kJLLJFCDk..............',
    '..........kkILLIEDk.............',
    '...........kGIILIGDkkk..........',
    '...........kMIkLLLIEEEkkkk......',
    '............kk.kkJLJIFFDDEkkk...',
    '.................kGGJkJGGIGGJk..',
    '..................kMk.kDFkkkk...',
    '...................k...kFk......',
    '........................kIk.....',
    '.........................kLk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The payara, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Payara.jpg, cut out with rembg, D97).
  'fish/payara': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...k............................',
    '..kIkk..........................',
    '.kFLFEkk........................',
    '.kGeeFCAkk......................',
    '.kCexLFDBCkk....................',
    '.kCMIIFAFDBBkk..................',
    '.kBIFIDDIFFDCCkk..kkk...........',
    '..kGFFFIFJIFFCCCkkAAAk..........',
    '..kCFGDCHHFIFFGCCCAAk...........',
    '...kFCBBFFHHFJFLGDCAk...........',
    '....kFABDDHFHHFILFDDkk..........',
    '.....kDBkFFDHHHJIILGDEk.........',
    '......kAkkkDDJHJJIFIIFCk........',
    '.......k...kkkFFFJJFFIDCk.......',
    '..............kkkDFGJIEFCk.kkk..',
    '.................kkDDIJFFEkECFk.',
    '...................kEEFFGFIEEEk.',
    '....................kkkEkFIEBCk.',
    '.......................kkFEACk..',
    '.........................kBAk...',
    '.........................kAk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The strange giant catfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Strange giant catfish.jpg, cut out with rembg, D97).
  'fish/strange-giant-catfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkk..........................',
    '..kECBkkkkk.....................',
    '..kHexDBBCBkkkkkkk..............',
    '..kGxxMECCCBAAAAABk.............',
    '...kLMMIFEDDCBAABCk.............',
    '....kMMIGEHGDCCBBk..............',
    '.....kHGDEEFFGDDCBk.............',
    '......kHEDDDELFFCDCkk...........',
    '.......kGMMIHMJHHFDBBk..........',
    '........kIJILLJJJEGCDk..........',
    '.........kLGMLHLJJJGECkk.kkkk...',
    '..........kDGLMMLILGFEDBkACBBk..',
    '..........kDkFFGGHDGFGFDCCCBk...',
    '...........k.kDEDCCkkkkDDCkk....',
    '..............kABkk...kCDk......',
    '...............kk.....kCCAk.....',
    '.......................kBAk.....',
    '........................kBk.....',
    '.........................k......',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The archerfish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Archerfish.jpg, cut out with rembg, D97).
  'fish/archerfish': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkk..........................',
    '..kEEHkkkkkk....................',
    '.kBBEHELHJJLkkk.................',
    '..kBeeEEEHJMMLMkkk..............',
    '..kCexAABHJHHJLMMLkkk...........',
    '..kCCBAABDBABEMMMMMMJk..........',
    '...kCCBBDDDDBEJLHEJMLGk.........',
    '...kCCFFDDJLLHHHBBELMJDk........',
    '....kFFGGFHLLLHDAAHLLHJHk.......',
    '.....kGGGFFHHEDDCDDEEDJDk.......',
    '......kFFGFGGIGGFDDCBBMJkkkkk...',
    '.......kkFGGGIIGFFDCDDHJJLLLHk..',
    '.........kGIIGIIGFDDDDDELJJIk...',
    '..........kkIIIIIIGGGFGDDDIk....',
    '............kkkFFDDDDBHCAAAk....',
    '...............kkAAAAADkAACk....',
    '.................kkkkkk.kAAk....',
    '.........................kAAk...',
    '..........................kACk..',
    '...........................kCCk.',
    '............................kk..',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The capelin, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Capelin.jpeg, cut out with rembg, D97).
  'fish/capelin': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..kkkkk.........................',
    '.kECCBCkkk......................',
    '..kDCCMBAAkk....................',
    '...kCGMexGCAkk..................',
    '....kkBxxCBAAAk...kk............',
    '......kILLEJIBAkkkBFk...........',
    '.......kBDIGJFBAABCEk...........',
    '........kkBEMDJGAAACk...........',
    '..........kkILJMCEBAk...........',
    '............kCCDCBGBAkk.........',
    '.............kJHCCJDBAAk........',
    '.............kCCkCBDECAAk.......',
    '.............kCBEkkGJBHCAkkkkk..',
    '..............kkk..kDJGADDEABAk.',
    '....................kkkkkCHCkk..',
    '.........................kBCk...',
    '.........................kABk...',
    '..........................kk....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The four-eyed fish, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Four-eyed fish.jpg, cut out with rembg, D97).
  'fish/four-eyed-fish': [
    '................................',
    '................................',
    '................................',
    '.......kk.......................',
    '......kACk......................',
    '.....kkABBkk....................',
    '....kCAABBBBkk..................',
    '....kEeeBAABBCkk................',
    '..kkkFexAABBCCCDk...............',
    '.kGIHGCBAAABBBCCCkk.............',
    '.kIMMMGCABAAAABBCCDkk...........',
    '..kJIMJECBBBBABBCEFFFkk.........',
    '...kIMLMHECCBBCCDEFFFGGk........',
    '....kIILLLIGCDDCDDEEEGHHkk......',
    '.....kIHILLLGEDDDEEEEGHHIHk.....',
    '......kMIILLMJGDDDEEFGHGHHHk....',
    '.......kMJHILLLIEDDEEGGGGGGHk...',
    '........kMJIHILLIFEEEGGGGFGHk...',
    '.........kJkkHHILMIEFGFFFFGHk...',
    '..........k..kkHHILLHGFGFFHk....',
    '...............kkIIJMJGFEFHk....',
    '.................kkJJJJGFGHk....',
    '...................kkIIJIGk.....',
    '.....................kkIJIkk....',
    '.......................kIIJJk...',
    '........................kIIJMk..',
    '.........................kIJMMk.',
    '..........................kMMk..',
    '...........................kk...',
    '................................',
    '................................',
    '................................',
  ],
  // The mangrove jack, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Mangrove jack.jpg, cut out with rembg, D97).
  'fish/mangrove-jack': [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '...kkkkkkkkkkkkkkk..............',
    '..kCFCDAABBAACGFGFk.............',
    '.kEIexDILIGBCCCFFGk.............',
    '.kBGxxDDDDDBDFDEDEEk............',
    '..kFCEEBBBDDFCDCCCECk...........',
    '...kDDCDAACFDDBBFABDk...........',
    '....kJCDDBBDDFBCCCBDGkk.........',
    '.....kFIDEGILLBCCCGECCDk........',
    '......kFGDILLLLDCBGCAEDDk.......',
    '.......kEFFFILLGDEEDBAAGk.......',
    '.......kDGGDDELFFDCBFAEDGk......',
    '........kDDkGIIIIGDCDEkkkkk.....',
    '........kDAkkIIFIBGDCELFCIIkk...',
    '.........kAk.kFBFBGBCCDDFDGLIk..',
    '..........k...kDDBFEDGDDFGGIIGk.',
    '..............kEBADDkkDJIFILIk..',
    '...............kkBBCk.kFDGDFk...',
    '.................kBAk..kIDBk....',
    '..................kk....kGBk....',
    '.........................kCk....',
    '..........................k.....',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
  ],
  // The bull shark, a rift fish (D104), from a picture on Wikimedia Commons (docs/design/refs_rift/Bull shark.jpg, cut out with rembg, D97).
  'fish/bull-shark': [
    '................................',
    '................................',
    '................................',
    '....k...........................',
    '...kCk..........................',
    '...kCk..........................',
    '...kCk..........................',
    '...kCCk.........................',
    '...kGCk.........................',
    '...kFGCk...........k............',
    '...kGICkkk........kFk...........',
    '...kGLIIGIkkk....kFGk...........',
    '...kFLLeeGGIIkkkkDFFDk..........',
    '..kFFkMexFFFFFGFADDFDk..........',
    '...kkkGMLJGDDDDDBBDDAk..........',
    '......kJLJIFFDDDBAABBk..........',
    '.....kGFJLJGFFEDBBABDk..........',
    '......kkkMLJFFFEEEBABDk.........',
    '........kMMLJFEEEEBBABFk........',
    '.........kLMLJHEBBBAABDGk.......',
    '..........kMMLJHEBAAAABEGk......',
    '...........kILLJHBBBABBEDGk.....',
    '............kkJFJBHHEBBEEFk.....',
    '.............kDAEBBEHHBBEEGk....',
    '............kIGFEHHBHHHHBEFIk...',
    '...........kIGGFEDHJLLLJIHEIk...',
    '............kkkkkkkkLMMMLJIFJk..',
    '....................kkMMMMLIIk..',
    '......................kkMMMMLLk.',
    '........................kkkkkk..',
    '................................',
    '................................',
  ],
});

/**
 * Colours an icon keeps to itself, over KEYS: in that icon, these letters
 * mean these colours. Lets a detailed icon have its own palette without
 * running the shared one out of letters.
 * @type {Record<string, Record<string, string>>}
 */
export const OWN_KEYS = {
  'fish/carp': {
    D: '#3f4426', // back, scale rims
    O: '#6e7043', // back
    o: '#8c8a55', // flank
    G: '#ae9f5e', // gold flank
    g: '#cbbd80', // lower flank
    c: '#e6dfc0', // belly
    F: '#c4a86e', // fin
    f: '#8c7349', // fin ray
    R: '#cf5427', // red fin
    r: '#e2883c', // red fin, lighter
    L: '#d9a25a', // lips
    e: '#e9e6de', // eye ring
    x: '#141414', // eye
  },
  'fish/zander': {
    A: '#292016', // back
    B: '#392e23', // back, saddles
    C: '#493a32', // tail, dark
    D: '#50423a', // tail
    E: '#5d5446', // upper flank
    F: '#63605b', // flank, dark
    G: '#81786f', // flank
    H: '#8a8782', // flank, light
    I: '#97918a', // lower flank
    J: '#9f9c98', // lower flank, light
    L: '#a9a7a2', // belly
    M: '#b1b2b0', // belly, light
    x: '#141414', // eye
    e: '#d9d6c4', // eye ring, glassy
  },
  'fish/cassalan-pike': {
    A: '#171b22', // back, dark shading
    B: '#26282e', // back, dark shading
    C: '#353a45', // back, dark shading
    D: '#3e3c39', // upper flank
    E: '#4e4b4b', // upper flank
    F: '#605f63', // upper flank
    G: '#827b78', // upper flank
    H: '#a19692', // lower flank
    I: '#b9aaa1', // lower flank
    J: '#d1c5bc', // belly, highlights
    L: '#e2d5ce', // belly, highlights
    M: '#f4ebe4', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/frostfin-char': {
    A: '#3c3e58', // back, dark shading
    B: '#475373', // back, dark shading
    C: '#4f5f7f', // back, dark shading
    D: '#556a92', // upper flank
    E: '#696881', // upper flank
    F: '#876272', // upper flank
    G: '#607596', // upper flank
    H: '#777e99', // lower flank
    I: '#ba716a', // lower flank
    J: '#c6807f', // belly, highlights
    L: '#9d99a7', // belly, highlights
    M: '#db9898', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/great-sea-salmon': {
    A: '#262a1e', // back, dark shading
    B: '#38372d', // back, dark shading
    C: '#303b3d', // back, dark shading
    D: '#5a5249', // upper flank
    E: '#726864', // upper flank
    F: '#8f8074', // upper flank
    G: '#9f8e8b', // upper flank
    H: '#ada5a6', // lower flank
    I: '#baa59a', // lower flank
    J: '#cbbab4', // belly, highlights
    L: '#e1d4cd', // belly, highlights
    M: '#f7efe6', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/black-crappie': {
    A: '#33362f', // back, dark shading
    B: '#4e5447', // back, dark shading
    C: '#626554', // back, dark shading
    D: '#727663', // upper flank
    E: '#828673', // upper flank
    F: '#948f6c', // upper flank
    G: '#949581', // upper flank
    H: '#9f9f88', // lower flank
    I: '#b1ae97', // lower flank
    J: '#c1bea8', // belly, highlights
    L: '#d0cdbb', // belly, highlights
    M: '#e2dfce', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/brown-bullhead': {
    A: '#131913', // back, dark shading
    B: '#302918', // back, dark shading
    C: '#354135', // back, dark shading
    D: '#3f5a50', // upper flank
    E: '#605839', // upper flank
    F: '#3e6666', // upper flank
    G: '#7a7a56', // upper flank
    H: '#968f66', // lower flank
    I: '#a6b0a0', // lower flank
    J: '#b6b368', // belly, highlights
    L: '#d9d48f', // belly, highlights
    M: '#dbe0ca', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/brown-trout': {
    A: '#3c3222', // back, dark shading
    B: '#44423a', // back, dark shading
    C: '#514228', // back, dark shading
    D: '#584d3a', // upper flank
    E: '#624d2f', // upper flank
    F: '#69592d', // upper flank
    G: '#6e5c40', // upper flank
    H: '#83633b', // lower flank
    I: '#866b49', // lower flank
    J: '#93764e', // belly, highlights
    L: '#a3815b', // belly, highlights
    M: '#be9161', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/central-mudminnow': {
    A: '#30280c', // back, dark shading
    B: '#4e3f16', // back, dark shading
    C: '#604d1b', // back, dark shading
    D: '#725725', // upper flank
    E: '#8c7133', // upper flank
    F: '#a98e41', // upper flank; fin colour
    G: '#bfa03f', // upper flank; fin colour
    H: '#c5ac62', // lower flank; fin colour
    J: '#e2be3d', // lower flank; fin colour
    I: '#cfbc7b', // belly, highlights
    L: '#decf9c', // belly, highlights
    M: '#edd37a', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/channel-catfish': {
    A: '#2e2a36', // back, dark shading
    B: '#33313b', // back, dark shading
    C: '#3b373e', // back, dark shading
    D: '#393848', // upper flank
    E: '#433e45', // upper flank
    F: '#454758', // upper flank
    G: '#534a48', // upper flank
    H: '#505263', // lower flank
    I: '#675e5d', // lower flank
    J: '#666675', // belly, highlights
    L: '#8b8180', // belly, highlights
    M: '#cdc2b8', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/cisco': {
    A: '#685b3c', // back, dark shading
    B: '#8d7d54', // back, dark shading
    C: '#908b7d', // back, dark shading
    D: '#ad9862', // upper flank
    E: '#aaa799', // upper flank
    F: '#bdae85', // upper flank
    G: '#c0b9a0', // upper flank
    H: '#d4c59b', // lower flank
    I: '#dfd1a8', // lower flank
    J: '#e7dbb4', // belly, highlights
    L: '#eddfb5', // belly, highlights
    M: '#f1e4bd', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/mainland-whitefish': {
    A: '#271109', // back, dark shading
    B: '#432918', // back, dark shading
    C: '#73572a', // back, dark shading
    D: '#725f56', // upper flank
    E: '#968450', // upper flank
    F: '#a59f75', // upper flank
    H: '#c6c895', // lower flank
    I: '#cdd7ae', // lower flank
    J: '#d6e8cb', // belly, highlights
    L: '#e1f0db', // belly, highlights
    M: '#ecf8ec', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/grayling': {
    A: '#2d2a24', // back, dark shading
    B: '#73303b', // back, dark shading
    C: '#5f4f52', // back, dark shading
    D: '#825c67', // upper flank
    E: '#81747e', // upper flank
    F: '#aa8c57', // upper flank
    G: '#989690', // upper flank
    H: '#a4aba1', // lower flank
    I: '#b4bdc4', // lower flank
    J: '#bbc4ad', // belly, highlights
    L: '#cacfc8', // belly, highlights
    M: '#d7dbdc', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/lake-whitefish': {
    A: '#534b3a', // back, dark shading
    B: '#6a6045', // back, dark shading
    C: '#8a7b5a', // back, dark shading
    D: '#a38c64', // upper flank
    E: '#998f75', // upper flank
    F: '#ac9e78', // upper flank
    G: '#bfad82', // upper flank
    H: '#c9bc92', // lower flank
    I: '#cdc09f', // lower flank
    J: '#ddd2ac', // belly, highlights
    L: '#ece4c4', // belly, highlights
    M: '#f7f2db', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/largemouth-bass': {
    A: '#181d24', // back, dark shading
    B: '#3b3f3d', // back, dark shading
    C: '#424d56', // back, dark shading
    D: '#5e5338', // upper flank
    E: '#535b5b', // upper flank
    F: '#526174', // upper flank
    G: '#716a45', // upper flank
    H: '#626b6b', // lower flank
    I: '#6c777c', // lower flank
    J: '#7f7a55', // belly, highlights
    L: '#88918b', // belly, highlights
    M: '#9ca9a4', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/rudd': {
    A: '#4d390a', // back, dark shading
    B: '#685e2e', // back, dark shading
    C: '#bc4b00', // back, dark shading; fin colour
    D: '#786f40', // upper flank
    E: '#908156', // upper flank
    F: '#b98018', // upper flank; fin colour
    G: '#9a8f6b', // upper flank
    H: '#a69c77', // lower flank
    I: '#c09e5a', // lower flank; fin colour
    J: '#b5ab85', // belly, highlights
    L: '#bcb592', // belly, highlights
    M: '#c4bf9b', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/sauger': {
    A: '#463c26', // back, dark shading
    B: '#5d5134', // back, dark shading
    C: '#68604d', // back, dark shading
    D: '#767253', // upper flank
    F: '#867541', // upper flank
    E: '#727868', // upper flank
    G: '#7b8779', // upper flank
    H: '#908365', // lower flank
    I: '#9b9180', // lower flank
    J: '#b0a69e', // belly, highlights
    L: '#c5bdb6', // belly, highlights
    M: '#d8d4cd', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/silver-carp': {
    A: '#817968', // back, dark shading
    B: '#898d7f', // back, dark shading
    C: '#a69579', // back, dark shading
    D: '#9e9f8e', // upper flank
    E: '#bba989', // upper flank
    F: '#b3af9e', // upper flank
    G: '#d0b993', // upper flank
    H: '#c4bdab', // lower flank
    I: '#c9cbbd', // lower flank
    J: '#d3c9b2', // belly, highlights
    L: '#dfd6c4', // belly, highlights
    M: '#e1e2d9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/smallmouth-bass': {
    A: '#515149', // back, dark shading
    B: '#5e5d50', // back, dark shading
    C: '#6a6854', // back, dark shading
    D: '#706f60', // upper flank
    E: '#7e7755', // upper flank
    F: '#7f7b63', // upper flank
    G: '#968e66', // upper flank
    H: '#979982', // lower flank
    I: '#aaa986', // lower flank
    J: '#c2c099', // belly, highlights
    L: '#dedbb0', // belly, highlights
    M: '#e8e8cd', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/walleye': {
    A: '#3f3722', // back, dark shading
    B: '#574d36', // back, dark shading
    C: '#655a43', // back, dark shading
    D: '#7b6e49', // upper flank
    E: '#7a705e', // upper flank
    F: '#857b64', // upper flank
    G: '#998753', // upper flank
    H: '#9b8d6e', // lower flank
    I: '#a79e87', // lower flank
    J: '#c0b285', // belly, highlights
    L: '#d2cbb2', // belly, highlights
    M: '#eae8df', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/frostfin-grayling': {
    A: '#5d4e24', // back, dark shading
    B: '#675d43', // back, dark shading
    C: '#7a631c', // back, dark shading; fin colour
    D: '#786c4a', // upper flank
    E: '#706d6b', // upper flank
    F: '#7c7765', // upper flank
    G: '#80797a', // upper flank
    H: '#857f72', // lower flank
    I: '#a18334', // lower flank; fin colour
    J: '#8a8968', // belly, highlights
    L: '#958b82', // belly, highlights
    M: '#a59a8b', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/bowfin': {
    A: '#49321b', // back, dark shading
    B: '#593f23', // back, dark shading
    C: '#66482a', // back, dark shading
    D: '#705435', // upper flank
    E: '#875c33', // upper flank
    F: '#81694a', // upper flank
    G: '#a7693c', // upper flank; fin colour
    H: '#8f7751', // lower flank
    I: '#a5875b', // lower flank
    J: '#b19b73', // belly, highlights
    L: '#c7bb94', // belly, highlights
    M: '#e6d8a9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/brook-trout': {
    A: '#5a3c1f', // back, dark shading
    B: '#684f2d', // back, dark shading
    C: '#775e30', // back, dark shading
    D: '#de4314', // upper flank; fin colour
    E: '#8b6e34', // upper flank
    G: '#a07b3a', // upper flank; fin colour
    H: '#a98f4f', // lower flank; fin colour
    I: '#ce933f', // lower flank; fin colour
    J: '#c1a557', // belly, highlights; fin colour
    L: '#cbb372', // belly, highlights
    M: '#f1b95d', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/common-bream': {
    A: '#282426', // back, dark shading
    B: '#3a4256', // back, dark shading
    C: '#6d552b', // back, dark shading
    D: '#546484', // upper flank
    E: '#8d7952', // upper flank
    F: '#808498', // upper flank
    G: '#ab9b74', // upper flank
    H: '#a3a4ab', // lower flank
    I: '#b5ae9f', // lower flank
    J: '#bbb9b5', // belly, highlights
    L: '#cacac4', // belly, highlights
    M: '#d6d7d3', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/golden-shiner': {
    A: '#955b26', // back, dark shading; fin colour
    B: '#c26c35', // back, dark shading; fin colour
    C: '#958b5c', // back, dark shading
    D: '#b99238', // upper flank; fin colour
    E: '#db8b1a', // upper flank; fin colour
    F: '#c99d4d', // upper flank; fin colour
    G: '#c6ad65', // upper flank; fin colour
    H: '#eaa852', // lower flank; fin colour
    I: '#ddba64', // lower flank; fin colour
    J: '#ecbb85', // belly, highlights; fin colour
    L: '#e4c47a', // belly, highlights; fin colour
    M: '#edd39a', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/white-sucker': {
    A: '#434132', // back, dark shading
    B: '#595845', // back, dark shading
    C: '#685d33', // back, dark shading
    D: '#786f41', // upper flank
    E: '#6a715d', // upper flank
    F: '#92804c', // upper flank
    G: '#7e8977', // upper flank
    H: '#858c62', // lower flank
    I: '#8f9a73', // lower flank
    J: '#8c998b', // belly, highlights
    L: '#a7a268', // belly, highlights
    M: '#a3b08d', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/cassalan-sleeper': {
    A: '#53331c', // back, dark shading
    C: '#73430f', // back, dark shading; fin colour
    B: '#5c4737', // back, dark shading
    D: '#66544a', // upper flank
    E: '#835915', // upper flank; fin colour
    F: '#66606b', // upper flank
    G: '#796355', // upper flank
    H: '#8d6e2e', // lower flank; fin colour
    I: '#797175', // lower flank
    J: '#8c745d', // belly, highlights
    L: '#a2885f', // belly, highlights
    M: '#9f917b', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/asp': {
    A: '#080804', // back, dark shading
    B: '#1d1e12', // back, dark shading
    C: '#2e3021', // back, dark shading
    D: '#3a3b2d', // upper flank
    E: '#55422b', // upper flank
    F: '#504e3a', // upper flank
    G: '#65624a', // lower flank
    H: '#805d34', // lower flank
    I: '#7d7252', // belly, highlights
    J: '#8d8360', // belly, highlights
    M: '#b2a575', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/omul': {
    A: '#141612', // back, dark shading
    B: '#171b17', // back, dark shading
    C: '#1b1e1a', // back, dark shading
    D: '#1f2520', // upper flank
    E: '#292d26', // upper flank
    F: '#303731', // upper flank
    G: '#3d453f', // upper flank
    H: '#535f59', // lower flank
    I: '#67736c', // lower flank
    J: '#808d84', // belly, highlights
    L: '#8b9a93', // belly, highlights
    M: '#a2b3ab', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/barbel': {
    A: '#6d6961', // back, dark shading
    B: '#7c7768', // back, dark shading
    C: '#7e7e70', // back, dark shading
    D: '#858371', // upper flank
    F: '#948464', // upper flank
    E: '#878777', // upper flank
    G: '#919382', // upper flank
    H: '#a79778', // lower flank
    I: '#ab9967', // lower flank
    J: '#a6a990', // belly, highlights
    L: '#c1a776', // belly, highlights
    M: '#bfc6b4', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/bleak': {
    A: '#555029', // back, dark shading
    B: '#716c3d', // back, dark shading
    C: '#8f8e5e', // back, dark shading
    D: '#a8a17c', // upper flank
    E: '#bbb292', // upper flank
    F: '#c7bca0', // upper flank
    G: '#d6cbb1', // upper flank
    H: '#f1cca3', // lower flank
    I: '#e6ddcb', // lower flank
    J: '#f7f4e9', // belly, highlights
    L: '#f8f9f3', // belly, highlights
    M: '#fffffd', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/bluegill': {
    A: '#1c1813', // back, dark shading
    B: '#2b2c2c', // back, dark shading
    C: '#3d3c3a', // back, dark shading
    D: '#473c29', // upper flank
    E: '#57492c', // upper flank
    F: '#514f4a', // upper flank
    G: '#685535', // upper flank
    H: '#78623f', // lower flank
    I: '#6e6657', // lower flank
    J: '#89744f', // belly, highlights
    L: '#958362', // belly, highlights
    M: '#b09667', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/burbot': {
    A: '#413c30', // back, dark shading
    B: '#534c3c', // back, dark shading
    C: '#605644', // back, dark shading
    D: '#6d5e4b', // upper flank
    E: '#6f675b', // upper flank
    F: '#7f6b51', // upper flank
    G: '#837461', // lower flank
    H: '#968064', // lower flank
    I: '#9b8c7c', // belly, highlights
    J: '#a6a09f', // belly, highlights
    L: '#c8ac7c', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/chain-pickerel': {
    A: '#53401a', // back, dark shading
    B: '#604e3a', // back, dark shading
    C: '#76642f', // back, dark shading
    D: '#867626', // upper flank; fin colour
    E: '#8e805a', // upper flank
    F: '#978729', // upper flank; fin colour
    G: '#a9993f', // upper flank; fin colour
    H: '#ab996c', // lower flank
    I: '#c3ae57', // lower flank; fin colour
    J: '#c8b588', // belly, highlights
    L: '#dac6a0', // belly, highlights
    M: '#e9d2b6', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/chub': {
    A: '#2e302d', // back, dark shading
    B: '#3c3e38', // back, dark shading
    C: '#4e4a3d', // back, dark shading
    D: '#62583d', // upper flank
    E: '#5c5a54', // upper flank
    F: '#776b4c', // upper flank
    G: '#6b716a', // upper flank
    H: '#897b5b', // lower flank
    I: '#9b8d6c', // lower flank
    J: '#b19f74', // belly, highlights
    L: '#ada08a', // belly, highlights
    M: '#ccba8c', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/wildlands-perch': {
    A: '#351505', // back, dark shading
    B: '#431b02', // back, dark shading
    C: '#422509', // back, dark shading
    D: '#522605', // upper flank
    E: '#4f2e14', // upper flank
    F: '#5c330d', // upper flank
    G: '#664316', // upper flank
    H: '#694b26', // lower flank
    I: '#7c5e27', // lower flank
    J: '#907339', // belly, highlights
    L: '#b19850', // belly, highlights; fin colour
    M: '#dbc573', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/crucian-carp': {
    A: '#150d08', // back, dark shading
    B: '#24150b', // back, dark shading
    C: '#21211a', // back, dark shading
    D: '#40250f', // upper flank
    E: '#303326', // upper flank
    F: '#424230', // upper flank
    G: '#5f3917', // lower flank
    H: '#545540', // lower flank
    I: '#764e1e', // belly, highlights
    J: '#8f6424', // belly, highlights; fin colour
    M: '#a27c3c', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/dace': {
    A: '#636635', // back, dark shading
    B: '#817f42', // back, dark shading
    C: '#ba7b2b', // back, dark shading; fin colour
    D: '#ad8b37', // upper flank; fin colour
    E: '#9f9a4a', // upper flank
    F: '#da9539', // upper flank; fin colour
    G: '#c7ac62', // upper flank; fin colour
    H: '#cab84d', // lower flank; fin colour
    I: '#dcc96c', // lower flank; fin colour
    J: '#e5d781', // belly, highlights; fin colour
    L: '#e8de9a', // belly, highlights
    M: '#f6f2b8', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/deepwater-sculpin': {
    A: '#2c2426', // back, dark shading
    B: '#4f3b32', // back, dark shading
    C: '#604b3d', // back, dark shading
    D: '#7e5838', // upper flank
    E: '#7d634d', // upper flank
    F: '#9e6c35', // upper flank; fin colour
    G: '#936f48', // upper flank
    H: '#977c5d', // lower flank
    I: '#b68543', // lower flank; fin colour
    J: '#b39266', // belly, highlights
    L: '#d1b483', // belly, highlights
    M: '#efdfa9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/mainland-bullhead': {
    A: '#040504', // back, dark shading
    B: '#14130d', // back, dark shading
    C: '#1d1e12', // back, dark shading
    D: '#252716', // upper flank
    E: '#34220c', // upper flank
    F: '#303420', // upper flank
    G: '#463213', // upper flank
    H: '#48421f', // lower flank
    I: '#535132', // lower flank
    J: '#615320', // belly, highlights
    L: '#6b6034', // belly, highlights
    M: '#7d7344', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/mainland-mudminnow': {
    A: '#090909', // back, dark shading
    B: '#2e261d', // back, dark shading
    C: '#4f3b25', // back, dark shading
    D: '#454744', // upper flank
    E: '#684825', // upper flank
    F: '#735a3a', // upper flank
    G: '#8a6c47', // upper flank
    H: '#867861', // lower flank
    I: '#ae9b7d', // lower flank
    J: '#c4b397', // belly, highlights
    L: '#ded2b9', // belly, highlights
    M: '#ece7d1', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/golden-dorado': {
    A: '#222008', // back, dark shading
    B: '#3e3c15', // back, dark shading
    C: '#564b1e', // back, dark shading
    D: '#b82c08', // upper flank; fin colour
    E: '#605a2f', // upper flank
    F: '#825f1e', // upper flank; fin colour
    G: '#d44a0d', // upper flank; fin colour
    H: '#927b33', // lower flank; fin colour
    I: '#d36416', // lower flank; fin colour
    J: '#d77c25', // belly, highlights; fin colour
    L: '#cf9239', // belly, highlights; fin colour
    M: '#f3b249', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/grass-carp': {
    A: '#928362', // back, dark shading
    B: '#9d8e6d', // back, dark shading
    C: '#ab9977', // back, dark shading
    D: '#a69c8c', // upper flank
    E: '#b99b67', // upper flank
    F: '#bca37a', // upper flank
    G: '#beaf8b', // upper flank
    H: '#b8b09b', // lower flank
    I: '#caae80', // lower flank
    J: '#ddbf90', // belly, highlights
    L: '#cfc2a8', // belly, highlights
    M: '#e0d2b7', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/gudgeon': {
    A: '#20201e', // back, dark shading
    B: '#3c3522', // back, dark shading
    C: '#4c473b', // back, dark shading
    D: '#525456', // upper flank
    E: '#5f5244', // upper flank
    F: '#696462', // upper flank
    G: '#716451', // upper flank
    H: '#7b7475', // lower flank
    I: '#8f8372', // lower flank
    J: '#8d8a80', // belly, highlights
    L: '#999998', // belly, highlights
    M: '#b6baba', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/huchen': {
    A: '#827d73', // back, dark shading
    B: '#938b79', // back, dark shading
    C: '#9b947e', // back, dark shading
    D: '#a4a085', // upper flank
    E: '#b3aa88', // upper flank
    F: '#b8b290', // upper flank
    G: '#bcbb95', // upper flank
    H: '#c4c39d', // lower flank
    I: '#cecda6', // lower flank
    J: '#d7dab6', // belly, highlights
    L: '#e5e8c2', // belly, highlights
    M: '#f1f5d9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/ide': {
    A: '#2d3e49', // back, dark shading
    B: '#394b55', // back, dark shading
    C: '#54656c', // back, dark shading
    D: '#64757b', // upper flank
    E: '#937775', // upper flank
    F: '#838d89', // upper flank
    G: '#b98c83', // upper flank
    H: '#9e9a90', // lower flank
    I: '#a9a8a0', // lower flank
    J: '#b8bab0', // belly, highlights
    L: '#cec7bb', // belly, highlights
    M: '#e9e2d4', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/lake-sturgeon': {
    A: '#0e0d0f', // back, dark shading
    B: '#2b2a2b', // back, dark shading
    C: '#4d443d', // back, dark shading
    D: '#5b514b', // upper flank
    E: '#645951', // upper flank
    F: '#6c5f54', // upper flank
    G: '#74655c', // upper flank
    H: '#7b6d63', // lower flank
    I: '#827163', // lower flank
    J: '#877566', // belly, highlights
    L: '#8d7969', // belly, highlights
    M: '#8f7d70', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/lake-trout': {
    A: '#5f4726', // back, dark shading
    B: '#715c39', // back, dark shading
    C: '#80683e', // back, dark shading
    D: '#86734d', // upper flank
    E: '#947c4d', // upper flank
    F: '#a28b5f', // upper flank
    G: '#b39b71', // upper flank
    H: '#c1a980', // lower flank
    I: '#d8b587', // lower flank
    J: '#e3c797', // belly, highlights
    L: '#f2d3a4', // belly, highlights
    M: '#fce4b8', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/lenok': {
    A: '#949574', // back, dark shading
    B: '#aead89', // back, dark shading
    C: '#bdbc97', // back, dark shading
    D: '#cac9a3', // upper flank
    E: '#d3d1a9', // upper flank
    F: '#d9d7b0', // upper flank
    G: '#dddbb3', // upper flank
    H: '#e0dfb7', // lower flank
    I: '#e4e3bb', // lower flank
    J: '#e7e6bf', // belly, highlights
    L: '#eceac1', // belly, highlights
    M: '#f0f0c6', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/minnow': {
    A: '#422c06', // back, dark shading
    B: '#59380b', // back, dark shading
    C: '#6e4b16', // back, dark shading
    D: '#905e1a', // upper flank; fin colour
    E: '#997c3c', // upper flank; fin colour
    F: '#a88a48', // upper flank; fin colour
    G: '#bf8626', // upper flank; fin colour
    H: '#be9d53', // lower flank; fin colour
    I: '#dca431', // lower flank; fin colour
    J: '#d1af65', // belly, highlights; fin colour
    L: '#f5d251', // belly, highlights; fin colour
    M: '#f0d584', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/muskellunge': {
    A: '#7b7254', // back, dark shading
    B: '#838070', // back, dark shading
    C: '#97896b', // back, dark shading
    D: '#929282', // upper flank
    E: '#9a9d90', // upper flank
    F: '#ad9979', // upper flank
    G: '#a0a99d', // upper flank
    H: '#adb19c', // lower flank
    I: '#bfb699', // lower flank
    J: '#d0d0bc', // belly, highlights
    L: '#e9e7d4', // belly, highlights
    M: '#f2f2eb', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/nase': {
    A: '#090e07', // back, dark shading
    B: '#292e22', // back, dark shading
    C: '#502907', // back, dark shading
    D: '#4e4a30', // upper flank
    E: '#616448', // upper flank
    F: '#b84b15', // upper flank; fin colour
    G: '#766c42', // upper flank
    H: '#878560', // lower flank
    I: '#b47d44', // lower flank; fin colour
    J: '#af9c65', // belly, highlights
    L: '#c3b175', // belly, highlights
    M: '#d6c88e', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/northern-pike': {
    A: '#181313', // back, dark shading
    B: '#2f2f34', // back, dark shading
    C: '#414b55', // back, dark shading
    D: '#4b616f', // upper flank
    E: '#546c7c', // upper flank
    F: '#657a80', // upper flank
    G: '#798d89', // upper flank
    H: '#879897', // lower flank
    I: '#90a7a8', // lower flank
    J: '#9cb3b7', // belly, highlights
    L: '#acbfbf', // belly, highlights
    M: '#c0d1d7', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/northern-snakehead': {
    A: '#0c0c0a', // back, dark shading
    B: '#14110d', // back, dark shading
    C: '#1c140c', // back, dark shading
    D: '#1c1710', // upper flank
    E: '#211910', // upper flank
    F: '#291d11', // upper flank
    G: '#2d2113', // upper flank
    H: '#342818', // lower flank
    I: '#3d2e1a', // lower flank
    J: '#4e3a1f', // belly, highlights
    L: '#674e2c', // belly, highlights
    M: '#8c7349', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/perch': {
    A: '#32464d', // back, dark shading
    B: '#506464', // back, dark shading
    C: '#87755e', // back, dark shading
    D: '#75888a', // upper flank
    E: '#c77639', // upper flank; fin colour
    F: '#8b9a93', // upper flank
    G: '#9ca5a3', // upper flank
    H: '#a1aeb9', // lower flank
    I: '#b2c2c4', // lower flank
    J: '#cfbba9', // belly, highlights
    L: '#d1dbd6', // belly, highlights
    M: '#f6f9f6', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/ferrstad-carp': {
    A: '#3d2a1b', // back, dark shading
    B: '#574836', // back, dark shading
    C: '#7a5f46', // back, dark shading
    D: '#7b6f60', // upper flank
    E: '#8b877d', // upper flank
    F: '#a3815e', // upper flank
    G: '#bc9e7c', // upper flank
    H: '#cdb090', // lower flank
    I: '#dbbea0', // lower flank
    J: '#dec7ae', // belly, highlights
    L: '#e8d0b7', // belly, highlights
    M: '#f4e1ca', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/pumpkinseed': {
    A: '#151824', // back, dark shading
    B: '#232833', // back, dark shading
    C: '#403b39', // back, dark shading
    D: '#5a4c3d', // upper flank
    E: '#6e6653', // upper flank
    F: '#777c87', // upper flank
    G: '#837e61', // upper flank
    H: '#8b8c82', // lower flank
    I: '#a79f88', // lower flank
    J: '#95a1b7', // belly, highlights
    L: '#c8b78b', // belly, highlights
    M: '#dfd5b0', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/rainbow-trout': {
    A: '#271b13', // back, dark shading
    B: '#322a23', // back, dark shading
    C: '#433631', // back, dark shading
    D: '#4f4040', // upper flank
    E: '#5e514b', // upper flank
    F: '#715a4b', // upper flank
    G: '#766b5e', // upper flank
    H: '#7e766e', // lower flank
    I: '#918980', // lower flank
    J: '#a4a29d', // belly, highlights
    L: '#b5b5b2', // belly, highlights
    M: '#cecfcd', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/roach': {
    A: '#893524', // back, dark shading; fin colour
    B: '#615240', // back, dark shading
    C: '#a85437', // back, dark shading; fin colour
    D: '#8f7c65', // upper flank
    E: '#a6a184', // upper flank
    F: '#bec0b3', // upper flank
    G: '#ccc4a2', // upper flank
    H: '#d6d5bc', // lower flank
    I: '#e4e3cb', // lower flank
    J: '#f0f0dd', // belly, highlights
    L: '#f9fae9', // belly, highlights
    M: '#fdfef7', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/rock-bass': {
    A: '#505037', // back, dark shading
    B: '#636240', // back, dark shading
    C: '#76724f', // back, dark shading
    D: '#857f59', // upper flank
    E: '#948e63', // upper flank
    F: '#a59b6b', // upper flank
    G: '#b2a870', // upper flank
    H: '#b3a588', // lower flank
    I: '#c2b97e', // lower flank
    J: '#cec092', // belly, highlights
    L: '#d8c7a2', // belly, highlights
    M: '#e7dab9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/ruffe': {
    A: '#1b2816', // back, dark shading
    B: '#2a3c22', // back, dark shading
    C: '#445335', // upper flank
    D: '#696838', // upper flank
    E: '#6b715a', // upper flank
    H: '#93987f', // lower flank
    J: '#a6baa4', // lower flank
    L: '#c8e3dc', // belly, highlights
    M: '#ddf7fa', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/sea-lamprey': {
    A: '#522e16', // back, dark shading
    B: '#604527', // back, dark shading
    C: '#674e2e', // back, dark shading
    D: '#754b22', // upper flank
    E: '#6f5231', // upper flank
    F: '#82592f', // upper flank
    G: '#7b5c3a', // upper flank
    H: '#85643c', // lower flank
    I: '#926f42', // lower flank
    J: '#9c7947', // belly, highlights
    L: '#a98653', // belly, highlights
    M: '#bb965b', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/frostfin-sturgeon': {
    A: '#48483d', // back, dark shading
    B: '#828468', // back, dark shading
    C: '#9a9b87', // back, dark shading
    D: '#a4a199', // upper flank
    E: '#adaaa3', // upper flank
    F: '#b8b7a6', // upper flank
    G: '#c2bab1', // upper flank
    H: '#c4c0b5', // lower flank
    I: '#ccc7bc', // lower flank
    J: '#cfd5a9', // belly, highlights
    L: '#d6d2c7', // belly, highlights
    M: '#e4e6c1', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/silver-bream': {
    A: '#746b43', // back, dark shading
    B: '#98874a', // back, dark shading
    C: '#a69966', // back, dark shading
    D: '#bdad70', // upper flank
    E: '#d0bf7f', // upper flank
    F: '#e3c556', // upper flank; fin colour
    G: '#e2d28d', // upper flank
    H: '#f2e19a', // lower flank
    I: '#f2e8a7', // lower flank
    J: '#f4eeb2', // belly, highlights
    L: '#f8f3b9', // belly, highlights
    M: '#fefbbf', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/smelt': {
    A: '#47300f', // back, dark shading
    B: '#4b452e', // back, dark shading
    C: '#5d593e', // back, dark shading
    D: '#705c31', // upper flank
    E: '#6e6949', // upper flank
    G: '#85764b', // upper flank
    H: '#868262', // lower flank
    I: '#a09265', // lower flank
    J: '#a9a27b', // belly, highlights
    L: '#bdb58a', // belly, highlights
    M: '#cdc596', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/sterlet': {
    A: '#2d1001', // back, dark shading
    B: '#422605', // back, dark shading
    C: '#4b401b', // back, dark shading
    D: '#734e16', // upper flank; fin colour
    E: '#576642', // upper flank
    F: '#ce4501', // upper flank; fin colour
    G: '#b35514', // lower flank; fin colour
    H: '#97712f', // lower flank; fin colour
    J: '#a69141', // belly, highlights; fin colour
    L: '#b6aa60', // belly, highlights
    M: '#a4af80', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/stone-loach': {
    A: '#140d07', // back, dark shading
    B: '#201308', // back, dark shading
    C: '#271c0f', // back, dark shading
    D: '#322513', // upper flank
    E: '#4b1f0d', // upper flank
    F: '#3f301e', // upper flank
    G: '#592d1a', // upper flank
    H: '#5a4127', // lower flank
    I: '#793617', // lower flank; fin colour
    J: '#68583a', // belly, highlights
    L: '#935328', // belly, highlights; fin colour
    M: '#9a7447', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/taimen': {
    A: '#141e22', // back, dark shading
    B: '#182b2c', // back, dark shading
    C: '#5f2218', // back, dark shading
    D: '#353939', // upper flank
    E: '#404d4e', // upper flank
    F: '#666e6d', // upper flank
    G: '#9a5d4f', // upper flank
    H: '#958c8a', // lower flank
    I: '#e2aa95', // lower flank
    J: '#c1bcb7', // belly, highlights
    L: '#f3cdbf', // belly, highlights
    M: '#e8e5e1', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/tench': {
    A: '#2b2714', // back, dark shading
    B: '#3e4347', // back, dark shading
    C: '#504413', // back, dark shading
    D: '#685c38', // upper flank
    E: '#5d676e', // upper flank
    F: '#89743e', // upper flank
    G: '#89856d', // upper flank
    H: '#9e8a50', // lower flank
    I: '#aa9b68', // lower flank
    J: '#c39c38', // belly, highlights; fin colour
    L: '#b5a971', // belly, highlights
    M: '#ccb667', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/trahira': {
    A: '#41392e', // back, dark shading
    B: '#5b533f', // back, dark shading
    C: '#8b633b', // back, dark shading
    D: '#7c6d4d', // upper flank
    E: '#9a7247', // upper flank
    F: '#8f7c5d', // upper flank
    G: '#a4844e', // upper flank
    H: '#a38d66', // lower flank
    I: '#b79c5b', // lower flank; fin colour
    J: '#b89f77', // belly, highlights
    L: '#c7aa5d', // belly, highlights; fin colour
    M: '#d4bb78', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/vendace': {
    A: '#40322c', // back, dark shading
    B: '#5a483c', // back, dark shading
    C: '#625a50', // back, dark shading
    D: '#78665d', // upper flank
    E: '#957759', // upper flank
    F: '#958070', // upper flank
    G: '#a99381', // upper flank
    H: '#a49d94', // lower flank
    I: '#bcb6aa', // lower flank
    J: '#cec6bb', // belly, highlights
    L: '#e6dfd0', // belly, highlights
    M: '#f2ede1', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/weatherfish': {
    A: '#39292b', // back, dark shading
    B: '#4e3632', // back, dark shading
    C: '#484146', // back, dark shading
    D: '#5f3e33', // upper flank
    E: '#594d4b', // upper flank
    F: '#764b36', // upper flank
    G: '#5c575e', // upper flank
    H: '#7a5a49', // lower flank
    I: '#666470', // lower flank
    J: '#8f5e41', // belly, highlights
    L: '#8e6c5c', // belly, highlights
    M: '#c9936b', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/wels-catfish': {
    A: '#151a20', // back, dark shading
    B: '#1f2428', // back, dark shading
    C: '#2e322e', // back, dark shading
    D: '#353a34', // upper flank
    E: '#39403d', // upper flank
    F: '#3f4540', // upper flank
    G: '#484f47', // upper flank
    H: '#585c4e', // lower flank
    I: '#60665a', // lower flank
    J: '#757a64', // belly, highlights
    L: '#858c77', // belly, highlights
    M: '#a0aa89', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/yellow-perch': {
    A: '#6d5f3a', // back, dark shading
    B: '#95801c', // back, dark shading; fin colour
    C: '#8b8571', // back, dark shading
    D: '#a38a3a', // upper flank; fin colour
    E: '#c9ad40', // upper flank; fin colour
    F: '#afad9e', // upper flank
    G: '#c4ae72', // upper flank
    H: '#e3c236', // lower flank; fin colour
    I: '#ebd050', // lower flank; fin colour
    J: '#f3da6d', // belly, highlights; fin colour
    L: '#eedb95', // belly, highlights
    M: '#f0e5c9', // belly, highlights
    x: '#141414', // eye
    e: '#d8c050', // eye glint
  },
  'fish/giant-gourami': {
    A: '#3f3009', // back, dark shading
    B: '#563e14', // back, dark shading
    C: '#60501e', // back, dark shading
    D: '#6c5b27', // upper flank
    E: '#79672f', // upper flank
    F: '#88723c', // upper flank
    G: '#987f48', // upper flank
    H: '#a28e58', // lower flank
    I: '#ac9a65', // lower flank
    J: '#bca770', // belly, highlights
    L: '#ccb77d', // belly, highlights
    M: '#dfc78b', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/peacock-bass': {
    A: '#100601', // back, dark shading
    B: '#3d1c0a', // back, dark shading
    C: '#523c1f', // back, dark shading
    D: '#893211', // upper flank; fin colour
    E: '#70542b', // upper flank
    F: '#94682f', // upper flank; fin colour
    G: '#8b7b47', // upper flank
    H: '#a88844', // lower flank; fin colour
    I: '#af9a5a', // lower flank
    J: '#bea765', // belly, highlights
    L: '#c0b77e', // belly, highlights
    M: '#dacf95', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/silver-arowana': {
    A: '#2b312d', // back, dark shading
    B: '#464d47', // back, dark shading
    C: '#5d5b50', // back, dark shading
    D: '#67675b', // upper flank
    E: '#746f63', // upper flank
    F: '#7b766b', // upper flank
    G: '#7e7c72', // upper flank
    H: '#598f86', // lower flank
    I: '#8b8275', // lower flank
    J: '#918a82', // belly, highlights
    L: '#9d9a99', // belly, highlights
    M: '#b4abab', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/clown-knifefish': {
    A: '#17181c', // back, dark shading
    B: '#212225', // back, dark shading
    C: '#2b2b2e', // back, dark shading
    D: '#333435', // upper flank
    E: '#3b3c39', // upper flank
    F: '#404346', // upper flank
    G: '#4b483d', // upper flank
    H: '#4a4d4c', // lower flank
    I: '#5b5748', // lower flank
    J: '#565c60', // belly, highlights
    L: '#6e6651', // belly, highlights
    M: '#70787a', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/mudskipper': {
    A: '#1a0a07', // back, dark shading
    B: '#360c04', // back, dark shading
    C: '#511a0a', // back, dark shading
    D: '#422314', // upper flank
    E: '#5a2f1c', // upper flank
    F: '#693f24', // upper flank
    G: '#815532', // upper flank
    H: '#8a5921', // lower flank; fin colour
    I: '#966b3d', // lower flank
    J: '#ac8049', // belly, highlights; fin colour
    L: '#b9935a', // belly, highlights; fin colour
    M: '#cda96b', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/ornate-bichir': {
    A: '#0f0d0b', // back, dark shading
    B: '#38342d', // back, dark shading
    C: '#665d4b', // back, dark shading
    D: '#7e7051', // upper flank
    E: '#868169', // upper flank
    F: '#868980', // upper flank
    G: '#939382', // upper flank
    H: '#909795', // lower flank
    I: '#a09f86', // lower flank
    J: '#a9a9a0', // belly, highlights
    L: '#aebcc6', // belly, highlights
    M: '#c8bfb8', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/blackfish': {
    A: '#363636', // back, dark shading
    B: '#5e5e5e', // back, dark shading
    C: '#737373', // back, dark shading
    D: '#808080', // upper flank
    E: '#8b8b8b', // upper flank
    F: '#969696', // upper flank
    G: '#9e9e9e', // upper flank
    H: '#a6a6a6', // lower flank
    I: '#afafaf', // lower flank
    J: '#b6b6b6', // belly, highlights
    L: '#c3c3c3', // belly, highlights
    M: '#d3d3d3', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/marbled-lungfish': {
    A: '#260b01', // back, dark shading
    B: '#37190a', // back, dark shading
    C: '#4c280f', // back, dark shading
    D: '#5a361b', // upper flank
    E: '#614230', // upper flank
    F: '#784c28', // upper flank
    G: '#865e40', // upper flank
    H: '#ac784d', // lower flank; fin colour
    I: '#9c7c6a', // lower flank
    J: '#cb9f79', // belly, highlights
    L: '#e6bd97', // belly, highlights
    M: '#f5cfac', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/electric-eel': {
    A: '#15224a', // back, dark shading
    B: '#202f5c', // back, dark shading
    C: '#22346e', // back, dark shading
    D: '#374275', // upper flank
    E: '#53587c', // upper flank
    F: '#767798', // upper flank
    G: '#8485ab', // upper flank
    H: '#8b8db1', // lower flank
    I: '#9193ba', // lower flank
    J: '#9a98b5', // belly, highlights
    L: '#9c9dc1', // belly, highlights
    M: '#a5a5cb', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/arapaima': {
    A: '#160d14', // back, dark shading
    B: '#29151c', // back, dark shading
    C: '#302d1b', // back, dark shading
    D: '#3d2b30', // upper flank
    E: '#46373c', // upper flank
    F: '#4c434b', // upper flank
    G: '#52524e', // upper flank
    H: '#646563', // lower flank
    I: '#757970', // lower flank
    J: '#95a08b', // belly, highlights
    L: '#c5d1b3', // belly, highlights
    M: '#ecede5', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/strange-tilapia': {
    A: '#4d3d47', // back, dark shading
    B: '#62535f', // back, dark shading
    C: '#70626c', // back, dark shading
    D: '#7a6f76', // upper flank
    E: '#857a81', // upper flank
    F: '#8d848c', // upper flank
    G: '#8f8c94', // upper flank
    H: '#96929a', // lower flank
    I: '#9f9aa1', // lower flank
    J: '#a4a1a8', // belly, highlights
    L: '#aba8ae', // belly, highlights
    M: '#b4b2b5', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/oscar': {
    A: '#2e292f', // back, dark shading
    B: '#4b3428', // back, dark shading
    C: '#3b3b49', // back, dark shading
    D: '#5c3b1c', // upper flank
    E: '#53423b', // upper flank
    F: '#793d14', // upper flank; fin colour
    G: '#524e57', // upper flank
    H: '#7e512b', // lower flank
    I: '#9c580a', // lower flank; fin colour
    J: '#7c7371', // belly, highlights
    L: '#c06f12', // belly, highlights; fin colour
    M: '#cd9b1b', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/red-bellied-piranha': {
    A: '#33322d', // back, dark shading
    B: '#4a473a', // back, dark shading
    C: '#6b3c23', // back, dark shading
    D: '#5b5843', // upper flank
    E: '#765f27', // upper flank
    F: '#915234', // upper flank; fin colour
    G: '#76663f', // upper flank
    H: '#6c6c55', // lower flank
    I: '#826f37', // lower flank
    J: '#9a6f41', // belly, highlights
    L: '#828053', // belly, highlights
    M: '#8d8d6b', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/pacu': {
    A: '#5e1c1a', // back, dark shading
    B: '#526175', // back, dark shading
    C: '#bc634b', // back, dark shading; fin colour
    D: '#968784', // upper flank
    E: '#8899ae', // upper flank
    F: '#ac9f9b', // upper flank
    G: '#c59784', // upper flank
    H: '#f39373', // lower flank; fin colour
    I: '#afadb4', // lower flank
    J: '#b8bec8', // belly, highlights
    L: '#eabfab', // belly, highlights
    M: '#c6d4df', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/discus': {
    A: '#2c1d24', // back, dark shading
    B: '#6d2b1d', // back, dark shading
    C: '#972d18', // back, dark shading; fin colour
    D: '#c42316', // upper flank; fin colour
    E: '#e11611', // upper flank; fin colour
    F: '#f62619', // upper flank; fin colour
    G: '#fe361c', // upper flank; fin colour
    H: '#fd492b', // lower flank; fin colour
    I: '#fc6134', // lower flank; fin colour
    J: '#fc7b20', // belly, highlights; fin colour
    L: '#e68d61', // belly, highlights; fin colour
    M: '#fee039', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/electric-yellow-cichlid': {
    A: '#88ae49', // back, dark shading; fin colour
    B: '#aed902', // back, dark shading; fin colour
    C: '#b2d957', // back, dark shading; fin colour
    D: '#a7d1ae', // upper flank
    E: '#d2dd01', // upper flank; fin colour
    F: '#c6ec25', // upper flank; fin colour
    G: '#f3dc01', // upper flank; fin colour
    H: '#e9e319', // lower flank; fin colour
    I: '#e3fc08', // lower flank; fin colour
    J: '#fefc00', // belly, highlights; fin colour
    L: '#f7fe32', // belly, highlights; fin colour
    M: '#f7fc75', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/lumpfish': {
    A: '#0a0908', // back, dark shading
    B: '#131313', // back, dark shading
    C: '#1b1a1d', // back, dark shading
    D: '#232427', // upper flank
    E: '#2e2d30', // upper flank
    F: '#36363b', // upper flank
    G: '#43444d', // upper flank
    H: '#5e606d', // lower flank
    I: '#7f7f83', // lower flank
    J: '#92949e', // belly, highlights
    L: '#a2a7b4', // belly, highlights
    M: '#b9bdc6', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/frontosa': {
    A: '#1d1815', // back, dark shading
    B: '#272221', // back, dark shading
    C: '#322b28', // back, dark shading
    D: '#3a3335', // upper flank
    E: '#453a37', // upper flank
    F: '#4a4246', // upper flank
    G: '#554b29', // upper flank
    H: '#594f54', // lower flank
    I: '#6c6870', // lower flank
    J: '#79723a', // belly, highlights
    L: '#938c92', // belly, highlights
    M: '#c8c2c9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/wolffish': {
    A: '#433a2f', // back, dark shading
    B: '#60564a', // back, dark shading
    C: '#75695b', // back, dark shading
    D: '#807667', // upper flank
    E: '#8a8071', // upper flank
    F: '#968c7d', // upper flank
    G: '#a29584', // upper flank
    H: '#b4a597', // lower flank
    I: '#dad9cb', // lower flank
    J: '#edeee7', // belly, highlights
    L: '#f1faf5', // belly, highlights
    M: '#fcffff', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/strange-cod': {
    A: '#767060', // back, dark shading
    B: '#88816e', // back, dark shading
    C: '#908875', // back, dark shading
    D: '#98907a', // upper flank
    E: '#9f9681', // upper flank
    F: '#a79d86', // upper flank
    G: '#aba28b', // upper flank
    H: '#b3a890', // lower flank
    I: '#b9ae96', // lower flank
    J: '#bfb49c', // belly, highlights
    L: '#c9bea4', // belly, highlights
    M: '#d7ccb0', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/barramundi': {
    A: '#000700', // back, dark shading
    B: '#261f0f', // back, dark shading
    C: '#413b1c', // back, dark shading
    D: '#5a4c2f', // upper flank
    E: '#8a6b48', // upper flank
    F: '#ab927b', // upper flank
    G: '#c9ad8f', // upper flank
    H: '#dfcbb2', // lower flank
    I: '#f2e2cc', // lower flank
    J: '#f7ebe0', // belly, highlights
    L: '#fef5e6', // belly, highlights
    M: '#fffff9', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/polar-cod': {
    A: '#3a2e27', // back, dark shading
    B: '#4c4239', // back, dark shading
    C: '#5c4d44', // back, dark shading
    D: '#665b54', // upper flank
    E: '#696768', // upper flank
    F: '#78675a', // upper flank
    G: '#867e79', // upper flank
    H: '#9a8d7d', // lower flank
    I: '#929597', // lower flank
    J: '#9fa1a1', // belly, highlights
    L: '#bbb1a1', // belly, highlights
    M: '#d6d1c3', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/strange-perch': {
    A: '#64695c', // back, dark shading
    B: '#7c8573', // back, dark shading
    C: '#949874', // back, dark shading
    D: '#979e89', // upper flank
    E: '#98ac92', // upper flank
    F: '#b8ac82', // upper flank
    G: '#a9b7a0', // upper flank
    H: '#bab199', // lower flank
    I: '#cebf85', // lower flank
    J: '#c4c2a5', // belly, highlights
    L: '#d6cbad', // belly, highlights
    M: '#e9d8b7', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/goliath-tigerfish': {
    A: '#0d0a0c', // back, dark shading
    B: '#092635', // back, dark shading
    C: '#272c28', // back, dark shading
    D: '#10395f', // upper flank
    E: '#38431a', // upper flank
    F: '#39502b', // upper flank
    G: '#245785', // upper flank; fin colour
    H: '#455e36', // lower flank
    I: '#646f50', // lower flank
    J: '#4071bd', // belly, highlights; fin colour
    L: '#6d99df', // belly, highlights; fin colour
    M: '#9fc0f9', // belly, highlights; fin colour
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/goonch-catfish': {
    A: '#46402c', // back, dark shading
    B: '#545140', // back, dark shading
    C: '#666457', // back, dark shading
    D: '#6d6b5e', // upper flank
    E: '#727062', // upper flank
    F: '#777668', // upper flank
    G: '#7e7c70', // upper flank
    H: '#89877a', // lower flank
    I: '#979587', // lower flank
    J: '#a1a195', // belly, highlights
    L: '#aeaea4', // belly, highlights
    M: '#c7c7bf', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/snailfish': {
    A: '#b16b00', // back, dark shading; fin colour
    B: '#9c7519', // back, dark shading; fin colour
    C: '#a37b2b', // back, dark shading; fin colour
    D: '#c98601', // upper flank; fin colour
    E: '#aa966d', // upper flank
    F: '#d89e11', // upper flank; fin colour
    G: '#cfae57', // upper flank; fin colour
    H: '#efc306', // lower flank; fin colour
    I: '#c8c0ad', // lower flank
    J: '#e4c976', // belly, highlights; fin colour
    L: '#e5e2d3', // belly, highlights
    M: '#f1f4fa', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/giant-freshwater-stingray': {
    A: '#010505', // back, dark shading
    B: '#0a0e0b', // back, dark shading
    C: '#151610', // back, dark shading
    D: '#1f1e16', // upper flank
    E: '#2e2518', // upper flank
    F: '#3e2e1e', // upper flank
    G: '#4e3825', // upper flank
    H: '#66472c', // lower flank
    I: '#845936', // lower flank
    J: '#aa7649', // belly, highlights; fin colour
    L: '#d8a172', // belly, highlights; fin colour
    M: '#edd4af', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/icefish': {
    A: '#505050', // back, dark shading
    B: '#6a6a6a', // back, dark shading
    C: '#838383', // back, dark shading
    D: '#939393', // upper flank
    E: '#a0a0a0', // upper flank
    F: '#ababab', // upper flank
    G: '#b7b7b7', // upper flank
    H: '#c1c1c1', // lower flank
    I: '#c8c8c8', // lower flank
    J: '#d4d4d4', // belly, highlights
    L: '#e4e4e4', // belly, highlights
    M: '#f5f5f5', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/coelacanth': {
    A: '#264800', // back, dark shading
    B: '#396000', // back, dark shading; fin colour
    C: '#12840b', // back, dark shading; fin colour
    D: '#467502', // upper flank; fin colour
    E: '#358f15', // upper flank; fin colour
    F: '#60890d', // upper flank; fin colour
    G: '#64a128', // upper flank; fin colour
    H: '#81a12b', // lower flank; fin colour
    I: '#80b545', // lower flank; fin colour
    J: '#a8c458', // belly, highlights; fin colour
    L: '#c4db78', // belly, highlights; fin colour
    M: '#e4f69d', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/strange-shark': {
    A: '#555555', // back, dark shading
    B: '#898989', // back, dark shading
    C: '#b5b5b5', // back, dark shading
    D: '#cacaca', // upper flank
    E: '#d7d7d7', // upper flank
    F: '#e8e8e8', // lower flank
    G: '#f3f3f3', // lower flank
    H: '#fbfbfb', // lower flank
    I: '#fefefe', // belly, highlights
    J: '#ffffff', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/hillstream-loach': {
    A: '#050403', // back, dark shading
    B: '#090c17', // back, dark shading
    C: '#0f0e0b', // back, dark shading
    D: '#111826', // upper flank
    E: '#1f1e16', // upper flank
    F: '#1f2836', // upper flank
    G: '#373a2e', // upper flank
    H: '#394655', // lower flank
    I: '#596c6b', // lower flank
    J: '#68889f', // belly, highlights
    L: '#899d77', // belly, highlights
    M: '#a4c2bf', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/snow-trout': {
    A: '#454642', // back, dark shading
    B: '#6b6c68', // back, dark shading
    C: '#81817c', // back, dark shading
    D: '#91918b', // upper flank
    E: '#9e9e97', // upper flank
    F: '#a8a9a2', // upper flank
    G: '#b3b2ab', // upper flank
    H: '#bebeb8', // lower flank
    I: '#c5c5be', // lower flank
    J: '#cecec9', // belly, highlights
    L: '#d6d6d1', // belly, highlights
    M: '#e5e4dd', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/golden-mahseer': {
    A: '#4b3f41', // back, dark shading
    B: '#6a5f63', // back, dark shading
    C: '#8a7b7d', // back, dark shading
    D: '#9e8774', // upper flank
    E: '#9d8f8b', // upper flank
    F: '#a89d9f', // upper flank
    G: '#b8afae', // upper flank
    H: '#cdb59f', // lower flank
    I: '#d3c2b7', // lower flank
    J: '#d6d0d0', // belly, highlights
    L: '#e6e0dc', // belly, highlights
    M: '#f3f2f3', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/redtail-catfish': {
    A: '#09040e', // back, dark shading
    B: '#181223', // back, dark shading
    C: '#3b2c3f', // back, dark shading
    D: '#564256', // upper flank
    E: '#a5392e', // upper flank; fin colour
    F: '#63546d', // upper flank
    G: '#785d73', // upper flank
    H: '#826e84', // lower flank
    I: '#dc7568', // lower flank; fin colour
    J: '#9f8ca0', // belly, highlights
    L: '#c4a7b2', // belly, highlights
    M: '#ddd6e3', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/tiger-shovelnose-catfish': {
    A: '#130e16', // back, dark shading
    B: '#2a1411', // back, dark shading
    C: '#35211c', // back, dark shading
    D: '#322c2f', // upper flank
    E: '#4a352c', // upper flank
    F: '#58473a', // upper flank
    G: '#645954', // upper flank
    H: '#845f46', // lower flank
    I: '#736762', // lower flank
    J: '#7e7673', // belly, highlights
    L: '#888287', // belly, highlights
    M: '#a4907f', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/payara': {
    A: '#1a1619', // back, dark shading
    B: '#2c2522', // back, dark shading
    C: '#363331', // back, dark shading
    D: '#424237', // upper flank
    E: '#4e3e44', // upper flank
    F: '#595443', // upper flank
    G: '#5c5d52', // upper flank
    H: '#72674a', // lower flank
    I: '#726861', // lower flank
    J: '#817764', // belly, highlights
    L: '#928a7b', // belly, highlights
    M: '#aea494', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/strange-giant-catfish': {
    A: '#111111', // back, dark shading
    B: '#28282a', // back, dark shading
    C: '#444345', // back, dark shading
    D: '#64646a', // upper flank
    E: '#7d7c7f', // upper flank
    F: '#888990', // upper flank
    G: '#999a9e', // upper flank
    H: '#ababad', // lower flank
    I: '#b9b9b9', // lower flank
    J: '#c5c4c3', // belly, highlights
    L: '#d1d1d0', // belly, highlights
    M: '#e4e4e2', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/archerfish': {
    A: '#231b09', // back, dark shading
    B: '#302b1b', // back, dark shading
    C: '#3e300c', // back, dark shading
    D: '#453f1f', // upper flank
    E: '#4e4542', // upper flank
    F: '#5c500e', // upper flank
    G: '#716112', // upper flank; fin colour
    H: '#6e6254', // lower flank
    I: '#8b7616', // lower flank; fin colour
    J: '#98866f', // belly, highlights
    L: '#ab9e95', // belly, highlights
    M: '#d5c5c0', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/capelin': {
    A: '#898989', // back, dark shading
    B: '#a0a0a0', // back, dark shading
    C: '#ababab', // back, dark shading
    D: '#b5b5b5', // upper flank
    E: '#bcbcbc', // upper flank
    F: '#c1c1c1', // upper flank
    G: '#c5c5c5', // upper flank
    H: '#c9c9c9', // lower flank
    I: '#cdcdcd', // lower flank
    J: '#d2d2d2', // belly, highlights
    L: '#d9d9d9', // belly, highlights
    M: '#e5e5e5', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/four-eyed-fish': {
    A: '#151515', // back, dark shading
    B: '#1b1b1b', // back, dark shading
    C: '#262526', // back, dark shading
    D: '#323231', // upper flank
    E: '#413f3e', // upper flank
    F: '#4d4c4b', // upper flank
    G: '#5c5b5b', // upper flank
    H: '#78706f', // lower flank
    I: '#90807b', // lower flank
    J: '#a0938d', // belly, highlights
    L: '#c19e88', // belly, highlights
    M: '#c3b3ac', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
  'fish/mangrove-jack': {
    A: '#36362f', // back, dark shading
    B: '#464741', // back, dark shading
    C: '#50524c', // back, dark shading
    D: '#5a5c58', // upper flank
    E: '#626460', // upper flank
    F: '#6a6d68', // upper flank
    G: '#717572', // upper flank
    H: '#7a7e7b', // lower flank
    I: '#838886', // lower flank
    J: '#919592', // belly, highlights
    L: '#a3a8a6', // belly, highlights
    M: '#bac2c1', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye glint
  },
  'fish/bull-shark': {
    A: '#091a16', // back, dark shading
    B: '#0f2620', // back, dark shading
    C: '#032a49', // back, dark shading
    D: '#0d2b34', // upper flank
    E: '#16332f', // upper flank
    F: '#153b46', // upper flank
    G: '#154254', // upper flank
    H: '#214434', // lower flank
    I: '#1d4e5b', // lower flank
    J: '#2c6365', // belly, highlights
    L: '#408382', // belly, highlights
    M: '#5da79e', // belly, highlights
    x: '#141414', // eye
    e: '#e9e6de', // eye ring
  },
};

/**
 * The palette an icon is drawn with.
 * @param {string} name
 */
export const iconKeys = (name) => ({ ...KEYS, ...(OWN_KEYS[name] ?? {}) });

/** WoW's rarity colours (D49), for names and icon borders. */
export const RARITY_COLOURS = {
  poor: '#9d9d9d',
  common: '#ffffff',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};

/** An icon's side, in pixels (D98). */
const SIZE = 32;

/**
 * The icon's name for a fish species or an item: its own, if that art exists,
 * otherwise its kind's default (R15.5).
 * @param {{ kind: 'fish', id: string } | { kind: 'item', id: string }} thing
 */
export function iconName(thing) {
  const entity = thing.kind === 'fish' ? content.fish[thing.id] : content.items[thing.id];
  if (entity?.icon && ICONS[entity.icon]) return entity.icon;
  return thing.kind === 'fish' ? 'default/fish' : `default/${entity?.category ?? 'junk'}`;
}

/**
 * The weather's icon (R16.4), from its levels: snow or rain first, then
 * cloud, then wind. A clear sky shows the sun, or the moon after dark. Snow
 * falls when it is as cold as the scene's snow (src/scene/sky.js).
 * @param {{ temperature: number, wind: number, clouds: number, precipitation: number }} weather
 * @param {boolean} dark  Night or evening.
 */
export function weatherIcon(weather, dark) {
  if (weather.precipitation >= 2) {
    if (weather.temperature <= 2) return 'weather/snow';
    return weather.precipitation >= 4 ? 'weather/storm' : 'weather/rain';
  }
  if (weather.clouds >= 4) return 'weather/overcast';
  if (weather.clouds >= 2) return dark ? 'weather/partly-night' : 'weather/partly-day';
  if (weather.wind >= 4) return 'weather/wind';
  return dark ? 'weather/clear-night' : 'weather/clear-day';
}

/**
 * A 32×32 canvas with the icon centred on it (D98). An icon drawn at 16 is
 * doubled, each pixel a 2×2 block, so it stays sharp.
 * @param {string} name
 */
export function paintIcon(name) {
  if (!ICONS[name]) name = 'default/junk';
  const rows = ICONS[name];
  const keys = iconKeys(name);
  const zoom = DRAWN_AT_16.has(name) ? 2 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const top = Math.floor((SIZE / zoom - rows.length) / 2);
  rows.forEach((row, y) => {
    const left = Math.floor((SIZE / zoom - row.length) / 2);
    [...row].forEach((key, x) => {
      if (key === '.') return;
      ctx.fillStyle = keys[key];
      ctx.fillRect((left + x) * zoom, (top + y) * zoom, zoom, zoom);
    });
  });
  return canvas;
}
