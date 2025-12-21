# Dice Delver - Technical Implementation Plan

## File to Modify

```
src/views/home/index.tsx
```

This is the **only file** we modify. Everything lives in the `GameSandbox` component.

---

## Code Structure

```tsx
// src/views/home/index.tsx

// === IMPORTS (keep minimal, use what's already there) ===
import { FC, useState, useEffect } from 'react';
import pkg from '../../../package.json';

// === CONSTANTS (top of file, easy to tune) ===
const PLAYER_MAX_HP = 50;
const STARTING_ROLLS = 2;
const DICE_UNICODE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// Enemy definitions
const ENEMIES = { ... };

// === HELPER FUNCTIONS (pure, no side effects) ===
function rollDie(): number { ... }
function detectHand(dice: number[]): Hand { ... }
function calculateDamage(hand: Hand, sum: number): number { ... }
function calculateShieldGain(hand: Hand): number { ... }
function spawnEnemy(floor: number): Enemy { ... }
function rollEnemyIntent(enemy: Enemy, floor: number): Intent { ... }

// === HOMEVIEW (Scrolly frame wrapper) ===
export const HomeView: FC = () => { ... };

// === GAMESANDBOX (the actual game) ===
const GameSandbox: FC = () => { ... };
```

---

## State Management

```typescript
// All state lives in GameSandbox via useState

// Game phase
const [phase, setPhase] = useState<'title' | 'combat' | 'game-over'>('title');

// Player stats
const [hp, setHp] = useState(PLAYER_MAX_HP);
const [maxHp, setMaxHp] = useState(PLAYER_MAX_HP);
const [shield, setShield] = useState(0);
const [floor, setFloor] = useState(1);

// Dice state
const [dice, setDice] = useState([1, 1, 1, 1]);
const [locked, setLocked] = useState([false, false, false, false]);
const [rollsLeft, setRollsLeft] = useState(STARTING_ROLLS);
const [hasRolledOnce, setHasRolledOnce] = useState(false);

// Enemy state
const [enemy, setEnemy] = useState<Enemy | null>(null);
const [enemyShield, setEnemyShield] = useState(0);

// Combat feedback
const [lastHand, setLastHand] = useState<string | null>(null);
const [combatLog, setCombatLog] = useState<string>('');
```

---

## Type Definitions

```typescript
type HandType = 'sum' | 'pair' | 'two-pair' | 'three-kind' | 'straight' | 'quad';

interface Hand {
  type: HandType;
  rank: number;      // 0=sum, 1=pair, 2=two-pair, 3=three-kind, 4=straight, 5=quad
  values: number[];  // the dice values involved in the combo
}

interface Enemy {
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  actions: {
    type: 'attack' | 'defend' | 'heal' | 'curse' | 'skip';
    value: number;
    weight: number;  // probability weight (0-100)
  }[];
}

interface Intent {
  action: 'attack' | 'defend' | 'heal' | 'curse' | 'skip';
  value: number;
}
```

---

## Poker Hand Detection Logic

```typescript
function detectHand(dice: number[]): Hand {
  const sorted = [...dice].sort((a, b) => a - b);
  const counts: Record<number, number> = {};

  // Count occurrences
  for (const d of dice) {
    counts[d] = (counts[d] || 0) + 1;
  }

  const freqs = Object.values(counts).sort((a, b) => b - a);
  const uniqueValues = Object.keys(counts).map(Number).sort((a, b) => a - b);

  // Check for Quad (4 of a kind)
  if (freqs[0] === 4) {
    return { type: 'quad', rank: 5, values: dice };
  }

  // Check for Straight (4 sequential)
  // Valid straights: 1-2-3-4, 2-3-4-5, 3-4-5-6
  const isSequential = sorted.every((v, i) => i === 0 || v === sorted[i-1] + 1);
  if (isSequential && new Set(dice).size === 4) {
    return { type: 'straight', rank: 4, values: sorted };
  }

  // Check for Three of a Kind
  if (freqs[0] === 3) {
    return { type: 'three-kind', rank: 3, values: dice };
  }

  // Check for Two Pair
  if (freqs[0] === 2 && freqs[1] === 2) {
    return { type: 'two-pair', rank: 2, values: dice };
  }

  // Check for One Pair
  if (freqs[0] === 2) {
    return { type: 'pair', rank: 1, values: dice };
  }

  // Default: Sum (no combo)
  return { type: 'sum', rank: 0, values: dice };
}
```

---

## Damage & Shield Calculations

```typescript
// Damage multipliers by hand type
const DAMAGE_MULTIPLIERS: Record<HandType, number> = {
  'sum': 0.5,
  'pair': 1.0,
  'two-pair': 1.5,
  'three-kind': 2.0,
  'straight': 2.5,
  'quad': 3.0,
};

function calculateDamage(hand: Hand, diceSum: number): number {
  const multiplier = DAMAGE_MULTIPLIERS[hand.type];
  return Math.floor(diceSum * multiplier);
}

// Knight shield gains by hand type
const SHIELD_GAINS: Record<HandType, number> = {
  'sum': 0,
  'pair': 3,
  'two-pair': 6,
  'three-kind': 4,
  'straight': 5,
  'quad': 10,
};

function calculateShieldGain(hand: Hand): number {
  return SHIELD_GAINS[hand.type];
}
```

---

## Enemy Definitions (Phase 1: Skeleton only)

```typescript
const ENEMIES = {
  skeleton: {
    name: 'Skeleton',
    emoji: '💀',
    baseHp: 15,
    actions: [
      { type: 'attack', value: 6, weight: 70 },
      { type: 'defend', value: 5, weight: 30 },
    ],
  },
};

function spawnEnemy(floor: number): Enemy {
  const base = ENEMIES.skeleton;
  const scaledHp = Math.floor(base.baseHp + floor * 1.5);

  return {
    name: base.name,
    emoji: base.emoji,
    hp: scaledHp,
    maxHp: scaledHp,
    actions: base.actions.map(a => ({
      ...a,
      value: Math.floor(a.value + floor * 0.5),
    })),
  };
}

function rollEnemyIntent(enemy: Enemy, floor: number): Intent {
  const totalWeight = enemy.actions.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const action of enemy.actions) {
    roll -= action.weight;
    if (roll <= 0) {
      return { action: action.type, value: action.value };
    }
  }

  return { action: enemy.actions[0].type, value: enemy.actions[0].value };
}
```

---

## Combat Flow

### Turn Sequence

```
1. FLOOR START
   └─> spawnEnemy(floor)
   └─> rollEnemyIntent(enemy)
   └─> Display intent to player

2. PLAYER ROLL PHASE
   └─> Player clicks [ROLL]
   └─> Unlocked dice get new random values
   └─> rollsLeft -= 1
   └─> Player can tap dice to lock/unlock
   └─> Repeat until rollsLeft === 0 or player clicks [ACT]

3. PLAYER ACT
   └─> detectHand(dice)
   └─> damage = calculateDamage(hand, sum(dice))
   └─> shieldGain = calculateShieldGain(hand)
   └─> Apply damage to enemy (enemy.hp -= damage)
   └─> Add shield to player (shield += shieldGain)
   └─> Display hand name ("PAIR!", "STRAIGHT!")

4. CHECK ENEMY DEATH
   └─> If enemy.hp <= 0:
       └─> floor += 1
       └─> Reset dice state
       └─> Go to step 1
   └─> Else: continue to enemy turn

5. ENEMY TURN
   └─> Execute intent:
       - 'attack': Player takes damage (shield absorbs first)
       - 'defend': Enemy gains shield
       - 'heal': Enemy heals HP
       - 'curse': Player loses max HP
       - 'skip': Nothing happens
   └─> Roll new intent for next turn

6. CHECK PLAYER DEATH
   └─> If hp <= 0:
       └─> phase = 'game-over'
   └─> Else: Go to step 2 (new roll phase)
```

### Shield Absorption Logic

```typescript
function takeDamage(incomingDamage: number) {
  if (shield > 0) {
    if (shield >= incomingDamage) {
      // Shield absorbs all
      setShield(shield - incomingDamage);
      setCombatLog(`Shield absorbed ${incomingDamage} damage!`);
    } else {
      // Shield partially absorbs
      const overflow = incomingDamage - shield;
      setCombatLog(`Shield broke! Took ${overflow} damage.`);
      setShield(0);
      setHp(hp - overflow);
    }
  } else {
    // No shield, take full damage
    setHp(hp - incomingDamage);
    setCombatLog(`Took ${incomingDamage} damage!`);
  }
}
```

---

## UI Components (JSX Structure)

### Title Screen

```tsx
{phase === 'title' && (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <div className="text-4xl">🎲</div>
    <h1 className="text-2xl font-bold text-amber-400">DICE DELVER</h1>
    <p className="text-slate-400 text-sm">A Dice-Poker Roguelite</p>
    <button
      onClick={startGame}
      className="mt-4 px-6 py-2 bg-amber-500 text-black font-bold rounded-lg"
    >
      START
    </button>
  </div>
)}
```

### Combat Screen

```tsx
{phase === 'combat' && (
  <div className="flex flex-col h-full">
    {/* Floor indicator */}
    <div className="text-center text-amber-400 font-bold">
      FLOOR {floor}
    </div>

    {/* Enemy zone */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-4xl">{enemy.emoji}</div>
      <div className="text-sm text-slate-300">{enemy.name}</div>
      {/* Enemy HP bar */}
      <div className="w-32 h-2 bg-slate-700 rounded mt-2">
        <div
          className="h-full bg-rose-500 rounded transition-all"
          style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">{enemy.hp}/{enemy.maxHp}</div>
      {/* Intent */}
      <div className="mt-2 text-sm text-red-400">
        {intent.action === 'attack' && `⚔️ Attack ${intent.value}`}
        {intent.action === 'defend' && `🛡️ Shield ${intent.value}`}
        {intent.action === 'heal' && `💚 Heal ${intent.value}`}
      </div>
    </div>

    {/* Player stats */}
    <div className="px-2">
      {/* HP bar */}
      <div className="flex items-center gap-2">
        <span>❤️</span>
        <div className="flex-1 h-3 bg-slate-700 rounded">
          <div
            className="h-full bg-red-500 rounded transition-all"
            style={{ width: `${(hp / maxHp) * 100}%` }}
          />
        </div>
        <span className="text-xs">{hp}/{maxHp}</span>
      </div>
      {/* Shield bar */}
      <div className="flex items-center gap-2 mt-1">
        <span>🛡️</span>
        <div className="flex-1 h-3 bg-slate-700 rounded">
          <div
            className="h-full bg-sky-500 rounded transition-all"
            style={{ width: `${Math.min(shield, 20) / 20 * 100}%` }}
          />
        </div>
        <span className="text-xs">{shield}</span>
      </div>
    </div>

    {/* Dice tray */}
    <div className="flex justify-center gap-3 py-4">
      {dice.map((value, i) => (
        <button
          key={i}
          onClick={() => toggleLock(i)}
          className={`text-4xl p-2 rounded-lg transition-all ${
            locked[i]
              ? 'bg-amber-500/20 ring-2 ring-amber-400'
              : 'bg-slate-800'
          }`}
        >
          {DICE_UNICODE[value - 1]}
        </button>
      ))}
    </div>

    {/* Hand indicator */}
    {lastHand && (
      <div className="text-center text-amber-400 font-bold text-sm">
        {lastHand}
      </div>
    )}

    {/* Action buttons */}
    <div className="flex gap-2 px-2 pb-2">
      <button
        onClick={roll}
        disabled={rollsLeft === 0}
        className="flex-1 py-2 bg-slate-700 rounded-lg font-bold disabled:opacity-50"
      >
        🎲 ROLL ({rollsLeft})
      </button>
      <button
        onClick={act}
        disabled={!hasRolledOnce}
        className="flex-1 py-2 bg-emerald-600 rounded-lg font-bold disabled:opacity-50"
      >
        ⚔️ ACT
      </button>
    </div>
  </div>
)}
```

### Game Over Screen

```tsx
{phase === 'game-over' && (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <div className="text-4xl">💀</div>
    <h2 className="text-2xl font-bold text-red-500">GAME OVER</h2>
    <p className="text-slate-400">You reached</p>
    <p className="text-4xl font-bold text-amber-400">FLOOR {floor}</p>
    <button
      onClick={restart}
      className="mt-4 px-6 py-2 bg-amber-500 text-black font-bold rounded-lg"
    >
      TRY AGAIN
    </button>
  </div>
)}
```

---

## Action Handlers

```typescript
const startGame = () => {
  setPhase('combat');
  setHp(PLAYER_MAX_HP);
  setMaxHp(PLAYER_MAX_HP);
  setShield(0);
  setFloor(1);
  setDice([1, 1, 1, 1]);
  setLocked([false, false, false, false]);
  setRollsLeft(STARTING_ROLLS);
  setHasRolledOnce(false);

  const newEnemy = spawnEnemy(1);
  setEnemy(newEnemy);
  setEnemyIntent(rollEnemyIntent(newEnemy, 1));
};

const roll = () => {
  if (rollsLeft <= 0) return;

  const newDice = dice.map((d, i) => locked[i] ? d : rollDie());
  setDice(newDice);
  setRollsLeft(rollsLeft - 1);
  setHasRolledOnce(true);
};

const toggleLock = (index: number) => {
  if (!hasRolledOnce) return; // Can't lock before first roll
  const newLocked = [...locked];
  newLocked[index] = !newLocked[index];
  setLocked(newLocked);
};

const act = () => {
  if (!hasRolledOnce || !enemy) return;

  const hand = detectHand(dice);
  const sum = dice.reduce((a, b) => a + b, 0);
  const damage = calculateDamage(hand, sum);
  const shieldGain = calculateShieldGain(hand);

  // Display hand
  setLastHand(formatHandName(hand.type));

  // Apply shield gain
  setShield(s => s + shieldGain);

  // Apply damage to enemy
  const newEnemyHp = enemy.hp - damage;

  if (newEnemyHp <= 0) {
    // Enemy defeated, next floor
    nextFloor();
  } else {
    // Enemy survives, their turn
    setEnemy({ ...enemy, hp: newEnemyHp });
    executeEnemyTurn();
  }
};

const executeEnemyTurn = () => {
  // Apply enemy intent
  if (enemyIntent.action === 'attack') {
    takeDamage(enemyIntent.value);
  } else if (enemyIntent.action === 'defend') {
    setEnemyShield(s => s + enemyIntent.value);
  } else if (enemyIntent.action === 'heal') {
    setEnemy(e => e ? { ...e, hp: Math.min(e.hp + enemyIntent.value, e.maxHp) } : null);
  }

  // Check player death
  if (hp <= 0) {
    setPhase('game-over');
    return;
  }

  // Reset for next turn
  setLocked([false, false, false, false]);
  setRollsLeft(STARTING_ROLLS);
  setHasRolledOnce(false);
  setLastHand(null);

  // Roll new enemy intent
  if (enemy) {
    setEnemyIntent(rollEnemyIntent(enemy, floor));
  }
};

const nextFloor = () => {
  const newFloor = floor + 1;
  setFloor(newFloor);

  // Spawn new enemy
  const newEnemy = spawnEnemy(newFloor);
  setEnemy(newEnemy);
  setEnemyIntent(rollEnemyIntent(newEnemy, newFloor));

  // Reset dice state
  setDice([1, 1, 1, 1]);
  setLocked([false, false, false, false]);
  setRollsLeft(STARTING_ROLLS);
  setHasRolledOnce(false);
  setLastHand(null);
};

const restart = () => {
  setPhase('title');
};
```

---

## Implementation Phases Breakdown

### Phase 1 Deliverables (This PR)
- [x] Scrolly frame wrapper (HomeView)
- [x] Title screen
- [x] Basic state management
- [x] Dice rolling & locking
- [x] Poker hand detection
- [x] Single enemy (Skeleton)
- [x] Basic damage dealing
- [x] Game over screen
- [x] Restart functionality

### Phase 2 Deliverables
- [ ] Shield generation from combos
- [ ] Shield absorption on damage
- [ ] Shield bar UI
- [ ] Combat log messages

### Phase 3 Deliverables
- [ ] 5 enemy types (Skeleton, Slime, Goblin, Bat, Dark Mage)
- [ ] Enemy spawn pool by floor difficulty
- [ ] Boss (Bone Lord) every 10 floors
- [ ] Scaling formula for HP/damage

### Phase 4 Deliverables
- [ ] Dice roll animation
- [ ] Damage flash effects
- [ ] Hand callout animation
- [ ] Screen shake on big hits
- [ ] Enemy death animation
- [ ] Floor transition effect

---

## Testing Checklist

After implementation, manually verify:

1. **Title Screen**
   - [ ] Displays correctly
   - [ ] START button works

2. **Dice Mechanics**
   - [ ] ROLL button rolls unlocked dice
   - [ ] Tap to lock/unlock works
   - [ ] Can't lock before first roll
   - [ ] Roll count decrements
   - [ ] Can't roll at 0 rolls

3. **Combat**
   - [ ] Hand detection is correct
   - [ ] Damage applies to enemy
   - [ ] Enemy HP bar updates
   - [ ] Enemy intent displays

4. **Enemy Turn**
   - [ ] Attack damages player
   - [ ] HP bar updates
   - [ ] New intent rolls

5. **Progression**
   - [ ] Floor increments on kill
   - [ ] New enemy spawns
   - [ ] Stats scale

6. **Game Over**
   - [ ] Triggers at 0 HP
   - [ ] Shows final floor
   - [ ] Restart works

---

## Asset Strategy

### Approach: Emoji MVP → Sprite Polish

**Phase 1-3:** Use emoji/unicode for all visuals
- Faster to build and iterate
- No asset dependencies
- Can swap in sprites later

**Phase 4 (Polish):** Optionally replace with custom sprites
- Dice faces
- Enemy sprites
- UI elements

### Using Images (If Added)

Place assets in `/public/` folder:
```
/public/
  dice-1.png
  dice-2.png
  dice-3.png
  dice-4.png
  dice-5.png
  dice-6.png
  skeleton.png
  slime.png
  goblin.png
  bat.png
  dark-mage.png
  bone-lord.png
```

Reference without imports:
```tsx
<img src="/skeleton.png" className="w-16 h-16 [image-rendering:pixelated]" />
```

### Pixel Art Rendering

For crisp pixel art at any scale:
```tsx
className="[image-rendering:pixelated]"
// or
style={{ imageRendering: 'pixelated' }}
```

---

## Submission Package

### Google Drive Structure

```
Dice Delver Submission/
├── index.tsx                 ← Main game code (REQUIRED)
├── assets/                   ← Images folder (if used)
│   ├── dice-1.png
│   ├── skeleton.png
│   └── ...
├── README.txt                ← Setup instructions
└── screenshots/              ← 3 gameplay screenshots
    ├── screenshot-1.png
    ├── screenshot-2.png
    └── screenshot-3.png
```

### README.txt Template

```
DICE DELVER - Setup Instructions
================================

1. Replace src/views/home/index.tsx with the provided index.tsx
2. Copy all files from /assets/ into the /public/ folder
3. Run: npm install && npm run dev
4. Open: http://localhost:3000

Game by: [Your Name]
Twitter: @[your_handle]
```

### Submission Checklist

- [ ] index.tsx file (Google Drive link)
- [ ] X/Twitter post with:
  - [ ] Game name: "Dice Delver"
  - [ ] One-line description
  - [ ] Video trailer (screen recording)
  - [ ] #ScrollyGameJam hashtag
  - [ ] Tag @scrollyfeed and @superteamUK
- [ ] 3 gameplay screenshots
- [ ] Video trailer

---

## Questions to Resolve

1. ~~Should dice start pre-rolled or show placeholder until first roll?~~ → Start at [1,1,1,1], must roll first
2. ~~Can you ACT without rolling?~~ → No, must roll at least once
3. ~~Does shield persist between floors?~~ → Yes, per PRD
4. ~~Shield cap?~~ → No hard cap, but bar shows up to 20 visually
