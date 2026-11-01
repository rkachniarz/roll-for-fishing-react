Core Concept
The game is designed as a tribute to World of Warcraft fishing, expanding on that system with skill checks, dice rolling, and class-based abilities inspired by Dungeons & Dragons. It also features a deep itemization system, borrowing heavily from games like Brotato, Diablo, and Path of Exile.

Core Game Loop
The basic gameplay loop consists of:
Casting your fishing line with a button press

Watching the bobber as a timer counts down

Reacting to the bobber’s splash, signaling a catch

During this process, several dice rolls occur:
Is a fish caught?

If yes: what kind of fish, and what size?

If no: is it trash, treasure, or a special item?

Initially, these rolls are hidden from the player. However, through leveling, skills, and items, players gradually gain visibility into the system and can begin influencing outcomes.
One roll is always visible: the main player roll — a 20-sided die used for fishing.

Reflex + Dice Hybrid System
A key design idea is combining reflex-based gameplay with dice mechanics. If the player successfully reacts in time (clicking the bobber when it splashes), they are rewarded with a dice roll.
This creates a loop where focus and timing grant access to the deeper RPG mechanics. The combination of skill-based input and randomized outcomes aims to keep the gameplay engaging and rewarding.

Player Character
The player character is an MMO-style adventurer — similar to a Dungeons & Dragons character — who, for their own reasons, decides to go fishing near a small town.
The player chooses a class, such as:
Warrior

Mage

Rogue

As the player levels up their fishing skill by catching fish and fishing up treasure, they unlock class-flavored fishing abilities. These abilities should feel like extensions of their class identity:
A warrior might gain an ability to overpower and automatically catch a fish

A rogue might specialize in retrieving treasure instead of fish

A mage could influence probabilities or manipulate outcomes in unique ways


Itemization System
While fishing, failed attempts to catch fish trigger a secondary roll that determines alternative rewards.
Item categories include:
Trash items (e.g., banana peels) with minimal use

Quest items that initiate small storylines

Collectibles, such as map fragments that unlock new areas when completed

Player-benefiting items, each with a trade-off

All beneficial items include at least one downside. For example:
A fishing compendium might reveal enemy (fish) defense rolls

However, it could also increase fish defense as a drawback

This ensures meaningful decision-making and build variety.

Events System
To add variety, the game includes dynamic events triggered by:
World conditions

Items fished up

These events appear as pop-ups with dialogue trees. Player choices lead to different outcomes, including rewards or penalties. Choices should feel meaningful and impactful.
Events also serve as a tool for meta progression, such as:
Upgrading the town inn (increasing fish demand)

Unlocking vendors, like a scrap dealer who trades useless items for currency


Locations and Progression
The game features a location-based system that determines:
Available fish

Possible items

Event types

Each location uses simple loot tables.
Players begin with a single location:
A lake behind the inn

As they progress, they unlock new areas, such as:
Rivers

Pools near a mage tower

Players can freely switch between unlocked locations at any time. However, some quest-specific locations may disappear after completion.
Each location also has a hidden progression meter that tracks how much of its content the player has discovered. Like other systems, this is initially concealed and revealed over time.

Additional Systems
Weather System
Weather affects what types of fish can be caught, adding another layer of variability.
Fish Size and Records
Fish sizes are determined through rolls within defined categories:

Tiny
Small
Medium
Large
(and beyond)

Behind the scenes, more granular values are tracked. The game also records high and low scores for each fish type, encouraging optimization and replayability.

Look and feel

This should start as a React-based web application. Simple, but animated graphics can be achieved using one of many libraries. A view of the fishing location and an animation for the splash is a minimum. Player inventory, equipped items, fishing "bucket" with recently caught fish and such should feel similar to world of warcraft item management interface: based on a grid, with each item taking up one slot on the grid, with identical items stacking.

A player should be able to leave the game at any time and come back without any progress lost: time is frozen until the main button is pushed. Progress is saved after each fishing attempt.
