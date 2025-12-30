// Next, React
import { FC, useState } from "react";
import pkg from "../../../package.json";

// DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white select-none">
      {/* HEADER - fake Scrolly feed tabs */}
      <header className="flex items-center justify-center border-b border-white/10 py-3">
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-[11px]">
          <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
            Feed
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Casino
          </button>
          <button className="rounded-full px-3 py-1 text-slate-400">
            Kids
          </button>
        </div>
      </header>

      {/* MAIN - central game area (phone frame) */}
      <main className="flex flex-1 items-center justify-center px-4 py-3">
        <div className="relative aspect-[9/16] h-[min(85vh,700px)] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
          {/* Fake "feed card" top bar inside the phone */}
          <div className="flex items-center justify-between px-3 py-2 text-[10px] text-slate-400">
            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wide">
              Dice Delver
            </span>
            <span className="text-[9px] opacity-70">#ScrollyGameJam</span>
          </div>

          {/* The game lives INSIDE this phone frame */}
          <div className="flex h-[calc(100%-26px)] flex-col items-center justify-start px-3 pb-3 pt-1">
            <GameSandbox />
          </div>
        </div>
      </main>

      {/* FOOTER - tiny version text */}
      <footer className="flex h-5 items-center justify-center border-t border-white/10 px-2 text-[9px] text-slate-500">
        <span>Dice Delver v{pkg.version}</span>
      </footer>
    </div>
  );
};

// THIS IS THE ONLY PART YOU EDIT FOR THE JAM
// ============================================

// === CONSTANTS ===
const CHARACTER_HP: Record<string, number> = {
  knight: 70,
  mage: 55,
  archer: 55,
  rogue: 50,
};
const CHARACTER_ROLLS: Record<string, number> = {
  knight: 2,
  mage: 2,
  archer: 2,
  rogue: 3,
};
const DICE_IMAGES = [
  "/dice-1.png",
  "/dice-2.png",
  "/dice-3.png",
  "/dice-4.png",
  "/dice-5.png",
  "/dice-6.png",
];

const HAND_NAMES: Record<string, string> = {
  quad: "QUAD!",
  straight: "STRAIGHT!",
  "three-kind": "TRIPS!",
  "two-pair": "TWO PAIR!",
  pair: "PAIR!",
  sum: "HIGH CARD",
};

const DAMAGE_MULTIPLIERS: Record<string, number> = {
  quad: 3.0,
  straight: 2.5,
  "three-kind": 2.0,
  "two-pair": 1.5,
  pair: 1.0,
  sum: 0.5,
};

const SHIELD_GAINS: Record<string, number> = {
  quad: 10,
  straight: 5,
  "three-kind": 4,
  "two-pair": 6,
  pair: 3,
  sum: 0,
};

// === TYPES ===
type Phase = "title" | "character-select" | "combat" | "game-over";
type Character = "knight" | "mage" | "archer" | "rogue";
type HandType =
  | "quad"
  | "straight"
  | "three-kind"
  | "two-pair"
  | "pair"
  | "sum";

interface Hand {
  type: HandType;
  rank: number;
}

interface EnemyAction {
  type: "attack" | "defend" | "heal" | "curse" | "skip" | "poison" | "weaken";
  value: number;
  weight: number; // percentage
}

interface Enemy {
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  actions: EnemyAction[];
}

interface Intent {
  action: "attack" | "defend" | "heal" | "curse" | "skip" | "poison" | "weaken";
  value: number;
}

// === ENEMY TEMPLATES ===
interface EnemyTemplate {
  name: string;
  image: string;
  baseHp: number;
  baseDamage: number;
  actions: (scaledDamage: number) => EnemyAction[];
  weight: "common" | "uncommon" | "rare" | "boss";
}

const ENEMY_TEMPLATES: EnemyTemplate[] = [
  // === COMMON ENEMIES (Floor 1+) ===
  {
    name: "Skeleton",
    image: "/skeleton.png",
    baseHp: 15,
    baseDamage: 6,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 70 },
      { type: "defend", value: 5, weight: 30 },
    ],
    weight: "common",
  },
  {
    name: "Slime",
    image: "/slime.png",
    baseHp: 20,
    baseDamage: 4,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 60 },
      { type: "heal", value: 6, weight: 40 },
    ],
    weight: "common",
  },
  {
    name: "Goblin",
    image: "/goblin.png",
    baseHp: 12,
    baseDamage: 8,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 80 },
      { type: "skip", value: 0, weight: 20 },
    ],
    weight: "common",
  },
  {
    name: "Spider",
    image: "/spider.png",
    baseHp: 10,
    baseDamage: 5,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 50 },
      { type: "poison", value: 2, weight: 50 },
    ],
    weight: "common",
  },
  // === UNCOMMON ENEMIES (Floor 3+) ===
  {
    name: "Bat",
    image: "/bat.png",
    baseHp: 8,
    baseDamage: 5,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 90 },
      { type: "skip", value: 0, weight: 10 },
    ],
    weight: "uncommon",
  },
  {
    name: "Orc",
    image: "/orc.png",
    baseHp: 25,
    baseDamage: 10,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 75 },
      { type: "defend", value: 8, weight: 25 },
    ],
    weight: "uncommon",
  },
  {
    name: "Wolf",
    image: "/wolf.png",
    baseHp: 14,
    baseDamage: 9,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 85 },
      { type: "skip", value: 0, weight: 15 },
    ],
    weight: "uncommon",
  },
  // === RARE ENEMIES (Floor 6+) ===
  {
    name: "Dark Mage",
    image: "/dark-mage.png",
    baseHp: 18,
    baseDamage: 10,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 50 },
      { type: "curse", value: 2, weight: 50 },
    ],
    weight: "rare",
  },
  {
    name: "Ghost",
    image: "/ghost.png",
    baseHp: 12,
    baseDamage: 8,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 40 },
      { type: "weaken", value: 2, weight: 35 },
      { type: "skip", value: 0, weight: 25 },
    ],
    weight: "rare",
  },
  {
    name: "Mimic",
    image: "/mimic.png",
    baseHp: 22,
    baseDamage: 12,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 70 },
      { type: "heal", value: 10, weight: 30 },
    ],
    weight: "rare",
  },
];

// Bosses appear every 10 floors, cycling through the list
const BOSS_TEMPLATES: EnemyTemplate[] = [
  {
    name: "Bone Lord",
    image: "/bone-lord.png",
    baseHp: 40,
    baseDamage: 12,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 60 },
      { type: "defend", value: 15, weight: 40 },
    ],
    weight: "boss",
  },
  {
    name: "Fire Dragon",
    image: "/fire-dragon.png",
    baseHp: 55,
    baseDamage: 15,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 70 },
      { type: "attack", value: Math.floor(dmg * 0.5), weight: 30 }, // Flame breath (weaker AoE)
    ],
    weight: "boss",
  },
  {
    name: "Demon Lord",
    image: "/demon-lord.png",
    baseHp: 50,
    baseDamage: 14,
    actions: (dmg) => [
      { type: "attack", value: dmg, weight: 50 },
      { type: "curse", value: 5, weight: 30 },
      { type: "heal", value: 12, weight: 20 },
    ],
    weight: "boss",
  },
];

// === HELPER FUNCTIONS ===
const rollDie = (): number => Math.floor(Math.random() * 6) + 1;

const detectHand = (dice: number[]): Hand => {
  const counts: Record<number, number> = {};
  for (const d of dice) {
    counts[d] = (counts[d] || 0) + 1;
  }
  const freqs = Object.values(counts).sort((a, b) => b - a);
  const sorted = [...dice].sort((a, b) => a - b);

  // Quad
  if (freqs[0] === 4) return { type: "quad", rank: 5 };

  // Straight (4 sequential)
  const isSequential = sorted.every(
    (v, i) => i === 0 || v === sorted[i - 1] + 1
  );
  if (isSequential && new Set(dice).size === 4)
    return { type: "straight", rank: 4 };

  // Three of a kind
  if (freqs[0] === 3) return { type: "three-kind", rank: 3 };

  // Two pair
  if (freqs[0] === 2 && freqs[1] === 2) return { type: "two-pair", rank: 2 };

  // Pair
  if (freqs[0] === 2) return { type: "pair", rank: 1 };

  // Sum (no combo)
  return { type: "sum", rank: 0 };
};

const spawnEnemy = (floor: number): Enemy => {
  // Boss every 10 floors, Elite every 5 floors (but not boss floors)
  const isBoss = floor % 10 === 0 && floor > 0;
  const isElite = floor % 5 === 0 && !isBoss && floor > 0;

  let template: EnemyTemplate;

  if (isBoss) {
    // Cycle through bosses: Floor 10 = Boss 0, Floor 20 = Boss 1, Floor 30 = Boss 2, Floor 40 = Boss 0...
    const bossIndex = (Math.floor(floor / 10) - 1) % BOSS_TEMPLATES.length;
    template = BOSS_TEMPLATES[bossIndex];
  } else {
    // Build spawn pool based on floor
    const pool: EnemyTemplate[] = [];

    // Common enemies always available
    const commons = ENEMY_TEMPLATES.filter((e) => e.weight === "common");
    commons.forEach((e) => {
      pool.push(e, e, e); // 3x weight for commons
    });

    // Uncommon enemies after floor 3
    if (floor >= 3) {
      const uncommons = ENEMY_TEMPLATES.filter((e) => e.weight === "uncommon");
      uncommons.forEach((e) => {
        pool.push(e, e); // 2x weight for uncommons
      });
    }

    // Rare enemies after floor 6
    if (floor >= 6) {
      const rares = ENEMY_TEMPLATES.filter((e) => e.weight === "rare");
      rares.forEach((e) => {
        pool.push(e); // 1x weight for rares
      });
    }

    // Pick random enemy from pool
    template = pool[Math.floor(Math.random() * pool.length)];
  }

  // Scale stats based on floor and type (balanced for fun progression)
  let hpMultiplier = isBoss ? 1.0 : isElite ? 0.9 : 0.7;
  let damageMultiplier = isElite ? 0.3 : 0.15;
  const scaledHp = Math.floor(template.baseHp * (isElite ? 1.3 : 1) + floor * hpMultiplier);
  const scaledDamage = Math.floor(template.baseDamage * (isElite ? 1.15 : 1) + floor * damageMultiplier);

  // Build actions - elites get extra actions
  let actions = template.actions(scaledDamage);
  if (isElite) {
    // Add extra actions for elites based on what they don't have
    const hasDefend = actions.some(a => a.type === "defend");
    const hasHeal = actions.some(a => a.type === "heal");

    if (!hasDefend) {
      actions = [...actions, { type: "defend" as const, value: Math.floor(5 + floor * 0.5), weight: 20 }];
    }
    if (!hasHeal) {
      actions = [...actions, { type: "heal" as const, value: Math.floor(4 + floor * 0.3), weight: 15 }];
    }
    // Rebalance weights
    const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
    actions = actions.map(a => ({ ...a, weight: Math.floor(a.weight / totalWeight * 100) }));
  }

  return {
    name: isElite ? `Elite ${template.name}` : template.name,
    image: template.image,
    hp: scaledHp,
    maxHp: scaledHp,
    actions,
  };
};

const rollIntent = (enemy: Enemy): Intent => {
  const totalWeight = enemy.actions.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const action of enemy.actions) {
    roll -= action.weight;
    if (roll <= 0) {
      return { action: action.type, value: action.value };
    }
  }

  // Fallback to first action
  return { action: enemy.actions[0].type, value: enemy.actions[0].value };
};

// === GAME COMPONENT ===
const GameSandbox: FC = () => {
  // Game state
  const [phase, setPhase] = useState<Phase>("title");
  const [floor, setFloor] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [character, setCharacter] = useState<Character>("knight");

  // Player state
  const [hp, setHp] = useState(CHARACTER_HP.knight);
  const [maxHp, setMaxHp] = useState(CHARACTER_HP.knight);
  const [shield, setShield] = useState(0);
  const [arcaneStacks, setArcaneStacks] = useState(0);
  const [markStacks, setMarkStacks] = useState(0);
  const [poisonStacks, setPoisonStacks] = useState(0); // Damage per turn
  const [weakenTurns, setWeakenTurns] = useState(0); // Turns of reduced damage
  const [damageBonus, setDamageBonus] = useState(0); // Permanent damage bonus from progression

  // Dice state
  const [dice, setDice] = useState([1, 1, 1, 1]);
  const [locked, setLocked] = useState([false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(CHARACTER_ROLLS.knight);
  const [hasRolled, setHasRolled] = useState(false);

  // Enemy state
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [enemyShield, setEnemyShield] = useState(0);
  const [enemyPoison, setEnemyPoison] = useState(0);
  const [enemyWeaken, setEnemyWeaken] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);

  // Feedback state
  const [lastHand, setLastHand] = useState<string | null>(null);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [lastEnemyAction, setLastEnemyAction] = useState<Intent | null>(null);

  // === ACTIONS ===
  const openCharacterSelect = () => {
    setPhase("character-select");
  };

  const selectCharacter = (char: Character) => {
    setCharacter(char);
    startGame(char);
  };

  const startGame = (char?: Character) => {
    const selectedChar = char || character;
    const charHp = CHARACTER_HP[selectedChar];
    const charRolls = CHARACTER_ROLLS[selectedChar];
    setPhase("combat");
    setFloor(1);
    setHp(charHp);
    setMaxHp(charHp);
    setShield(0);
    setArcaneStacks(0);
    setMarkStacks(0);
    setPoisonStacks(0);
    setWeakenTurns(0);
    setDamageBonus(0);
    setDice([1, 1, 1, 1]);
    setLocked([false, false, false, false]);
    setRollsLeft(charRolls);
    setHasRolled(false);
    setLastHand(null);
    setLastDamage(null);
    setFeedbackText(null);
    setLastEnemyAction(null);

    const newEnemy = spawnEnemy(1);
    setEnemy(newEnemy);
    setEnemyShield(0);
    setEnemyPoison(0);
    setEnemyWeaken(0);
    setIntent(rollIntent(newEnemy));
  };

  const roll = () => {
    if (rollsLeft <= 0) return;

    const newDice = dice.map((d, i) => (locked[i] ? d : rollDie()));
    setDice(newDice);
    setRollsLeft(rollsLeft - 1);
    setHasRolled(true);
    setLastHand(null);
    setLastDamage(null);
    setFeedbackText(null);
    setLastEnemyAction(null);
  };

  const toggleLock = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasRolled) return;
    setLocked((prevLocked) => {
      const newLocked = [...prevLocked];
      newLocked[index] = !newLocked[index];
      return newLocked;
    });
  };

  const act = () => {
    if (!hasRolled || !enemy || !intent) return;

    let newHp = hp;
    let newPoisonStacks = poisonStacks;

    // Apply poison damage at start of turn
    if (poisonStacks > 0) {
      newHp = Math.max(1, newHp - poisonStacks);
      newPoisonStacks = Math.max(0, poisonStacks - 1); // Poison reduces by 1 each turn
    }

    // Detect hand and calculate damage
    const hand = detectHand(dice);
    const sum = dice.reduce((a, b) => a + b, 0);
    let damage = Math.floor((sum + damageBonus) * DAMAGE_MULTIPLIERS[hand.type]);

    // Apply weaken debuff
    if (weakenTurns > 0) {
      damage = Math.floor(damage * 0.5);
      setWeakenTurns(weakenTurns - 1);
    }

    let newShield = shield;
    let newStacks = arcaneStacks;
    let newMarks = markStacks;
    let handName = HAND_NAMES[hand.type];

    if (character === "knight") {
      // Knight's Shield Bash mechanic
      if (hand.type === "pair" && shield > 0) {
        // Pair: Deal bonus damage = shield, consume all shield
        const bashDamage = shield;
        damage += bashDamage;
        handName = `BASH! (+${bashDamage})`;
        newShield = 0;
      } else if (hand.type === "two-pair" && shield > 0) {
        // Two Pair: Deal bonus damage = 1.5x shield, keep half
        const bashDamage = Math.floor(shield * 1.5);
        damage += bashDamage;
        handName = `BASH! (+${bashDamage})`;
        newShield = Math.floor(shield / 2);
      } else {
        // Trips+: Normal behavior - gain shield
        newShield = shield + SHIELD_GAINS[hand.type];
      }
    } else if (character === "mage") {
      // Mage's Arcane Stacks mechanic - burst damage (nerfed)
      if (hand.type === "pair") {
        // Pair: +1 Arcane Stack, reduced damage
        newStacks = Math.min(arcaneStacks + 1, 5);
        handName = `+1 ARCANE`;
        damage = Math.floor(damage * 0.6);
      } else if (hand.type === "two-pair") {
        // Two Pair: +2 Arcane Stacks, reduced damage
        newStacks = Math.min(arcaneStacks + 2, 5);
        handName = `+2 ARCANE`;
        damage = Math.floor(damage * 0.6);
      } else if (hand.rank >= 3 && arcaneStacks > 0) {
        // Trips+: Consume stacks for +35% damage per stack + small heal
        const bonusMult = 1 + arcaneStacks * 0.35;
        const bonusDamage = Math.floor(damage * bonusMult) - damage;
        damage = Math.floor(damage * bonusMult);
        const healAmount = arcaneStacks * 2; // Reduced heal
        newHp = Math.min(newHp + healAmount, maxHp);
        handName = `UNLEASH! (+${bonusDamage}) +${healAmount} HP`;
        newStacks = 0;
      }
      // Mage has no shield mechanic
    } else if (character === "archer") {
      // Archer's Mark Prey mechanic + Poison arrows + Life steal
      if (hand.type === "pair") {
        // Pair: +1 Mark + 3 poison + heal
        newMarks = Math.min(markStacks + 1, 5);
        setEnemyPoison((p) => p + 3);
        const healAmount = 4;
        newHp = Math.min(newHp + healAmount, maxHp);
        handName = `+1 MARK +3 PSN +${healAmount} HP`;
      } else if (hand.type === "two-pair") {
        // Two Pair: +2 Marks + 4 poison + heal
        newMarks = Math.min(markStacks + 2, 5);
        setEnemyPoison((p) => p + 4);
        const healAmount = 6;
        newHp = Math.min(newHp + healAmount, maxHp);
        handName = `+2 MARK +4 PSN +${healAmount} HP`;
      } else if (hand.rank >= 3 && markStacks > 0) {
        // Trips+: Deal damage with Mark bonus, consume marks
        // Execute threshold: instant kill if enemy below 45% HP
        const executeThreshold = enemy.maxHp * 0.45;
        if (enemy.hp <= executeThreshold) {
          damage = enemy.hp + enemyShield + 999; // Overkill to ensure death
          handName = `EXECUTE! (LETHAL)`;
        } else {
          const bonusMult = 1 + markStacks * 0.4;
          const bonusDamage = Math.floor(damage * bonusMult) - damage;
          damage = Math.floor(damage * bonusMult);
          handName = `EXECUTE! (+${bonusDamage})`;
        }
        newMarks = 0;
      }
      // Archer has no shield mechanic
    } else if (character === "rogue") {
      // Rogue's High Roller mechanic - high risk, high reward
      if (hand.type === "pair" || hand.type === "sum") {
        // Weak hands: Chip damage + small heal
        damage = Math.floor(sum * 0.75);
        const healAmount = 3;
        newHp = Math.min(newHp + healAmount, maxHp);
        handName = `GRAZE +${healAmount} HP`;
      } else if (hand.type === "two-pair") {
        // Two Pair: 2x damage
        damage = Math.floor(sum * 2);
        handName = "TWO PAIR";
      } else if (hand.type === "three-kind") {
        // Trips: Deal solid damage + big heal + weaken enemy
        damage = Math.floor(sum * 3);
        const healAmount = 12;
        newHp = Math.min(newHp + healAmount, maxHp);
        setEnemyWeaken((w) => w + 2);
        handName = `TRIPS! +${healAmount} HP +2 WKN`;
      } else if (hand.type === "quad") {
        // Quad: Massive heal + some damage!
        const healAmount = 30;
        newHp = Math.min(hp + healAmount, maxHp);
        damage = Math.floor(sum * 2);
        handName = `JACKPOT! +${healAmount} HP`;
      } else if (hand.type === "straight") {
        // Straight: INSANE damage + poison
        damage = Math.floor(sum * 6);
        setEnemyPoison((p) => p + 5);
        handName = "STRAIGHT! +5 PSN";
      }
    }

    setLastHand(handName);
    setLastDamage(damage);
    setShield(newShield);
    setArcaneStacks(newStacks);
    setMarkStacks(newMarks);
    setHp(newHp);
    setPoisonStacks(newPoisonStacks);

    // Apply damage to enemy (accounting for enemy shield)
    let actualDamage = damage;
    if (enemyShield > 0) {
      if (enemyShield >= damage) {
        setEnemyShield(enemyShield - damage);
        actualDamage = 0;
      } else {
        actualDamage = damage - enemyShield;
        setEnemyShield(0);
      }
    }

    const newEnemyHp = enemy.hp - actualDamage;

    if (newEnemyHp <= 0) {
      // Enemy defeated
      nextFloor();
    } else {
      // Enemy survives, execute their turn
      setEnemy({ ...enemy, hp: newEnemyHp });
      enemyTurn(newHp, newShield);
    }
  };

  const enemyTurn = (currentHp: number, currentShield: number) => {
    if (!intent || !enemy) return;

    // Process enemy poison first (DoT at start of their turn)
    if (enemyPoison > 0) {
      const poisonDmg = enemyPoison;
      const newEnemyHp = enemy.hp - poisonDmg;
      setEnemy({ ...enemy, hp: newEnemyHp });
      setEnemyPoison((p) => Math.max(0, p - 1)); // Reduce by 1 each turn

      if (newEnemyHp <= 0) {
        // Enemy dies from poison
        nextFloor();
        return;
      }
    }

    // Track what enemy did (keep lastHand to show player result too)
    setLastEnemyAction(intent);

    if (intent.action === "attack") {
      // Apply weaken debuff (50% damage reduction)
      let damage = enemyWeaken > 0 ? Math.floor(intent.value * 0.5) : intent.value;
      if (enemyWeaken > 0) {
        setEnemyWeaken((w) => w - 1); // Reduce weaken by 1
      }
      let remainingShield = currentShield;
      if (remainingShield > 0) {
        if (remainingShield >= damage) {
          setShield(remainingShield - damage);
          setFeedbackText(`Shield blocks ${damage}!`);
          damage = 0;
        } else {
          damage = damage - remainingShield;
          setFeedbackText(`Shield breaks! -${damage} HP`);
          setShield(0);
        }
      } else {
        setFeedbackText(`-${damage} HP`);
      }

      const finalHp = currentHp - damage;
      setHp(finalHp);

      if (finalHp <= 0) {
        setPhase("game-over");
        return;
      }
    } else if (intent.action === "defend") {
      setEnemyShield((s) => s + intent.value);
      setFeedbackText(`Enemy shields +${intent.value}`);
    } else if (intent.action === "heal") {
      if (enemy) {
        setEnemy({
          ...enemy,
          hp: Math.min(enemy.hp + intent.value, enemy.maxHp),
        });
      }
      setFeedbackText(`Enemy heals +${intent.value}`);
    } else if (intent.action === "curse") {
      // Reduce max HP
      const newMaxHp = Math.max(1, maxHp - intent.value);
      setMaxHp(newMaxHp);
      if (currentHp > newMaxHp) {
        setHp(newMaxHp);
      }
      setFeedbackText(`Cursed! Max HP -${intent.value}`);
    } else if (intent.action === "poison") {
      // Add poison stacks (damage over time)
      setPoisonStacks((p) => p + intent.value);
      setFeedbackText(`Poisoned! +${intent.value} poison`);
    } else if (intent.action === "weaken") {
      // Add weaken turns (reduced damage)
      setWeakenTurns((w) => w + intent.value);
      setFeedbackText(`Weakened! -50% DMG for ${intent.value} turns`);
    } else if (intent.action === "skip") {
      // Enemy does nothing
      setFeedbackText("Enemy fled!");
    }

    // Reset for next turn
    setLocked([false, false, false, false]);
    setRollsLeft(CHARACTER_ROLLS[character]);
    setHasRolled(false);
    if (enemy) {
      setIntent(rollIntent(enemy));
    }
  };

  const nextFloor = () => {
    const newFloor = floor + 1;
    const wasBoss = floor % 10 === 0 && floor > 0;
    setFloor(newFloor);

    // Player progression rewards (generous healing)
    const healAmount = wasBoss ? 25 : 10;
    const newHp = Math.min(hp + healAmount, maxHp);
    setHp(newHp);
    setFeedbackText(`VICTORY! +${healAmount} HP`);

    // Clear debuffs on floor clear
    setPoisonStacks(0);

    // Gain damage bonus every floor
    setDamageBonus((d) => d + 1);

    const newEnemy = spawnEnemy(newFloor);
    setEnemy(newEnemy);
    setEnemyShield(0);
    setEnemyPoison(0);
    setEnemyWeaken(0);
    setIntent(rollIntent(newEnemy));

    setDice([1, 1, 1, 1]);
    setLocked([false, false, false, false]);
    setRollsLeft(CHARACTER_ROLLS[character]);
    setHasRolled(false);
    setLastHand(null);
    setLastDamage(null);
  };

  const restart = () => {
    setPhase("title");
  };

  // === RENDER ===

  // Title Screen
  if (phase === "title") {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-end pb-16 bg-cover bg-center relative"
        style={{
          backgroundImage: "url(/menu-bg.png)",
          imageRendering: "pixelated",
        }}
      >
        {/* Info Button */}
        <button
          onClick={() => setShowInfo(true)}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
            bg-stone-800/90 border-2 border-amber-600/60 text-amber-400 font-bold text-sm
            hover:bg-stone-700 hover:border-amber-500 transition-all"
        >
          ?
        </button>

        {/* Info Modal */}
        {showInfo && (
          <div className="absolute inset-0 bg-black/90 z-50 flex flex-col overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-amber-400 font-bold text-lg [text-shadow:1px_1px_2px_#000]">
                  HOW TO PLAY
                </h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 transition-all hover:brightness-125 active:scale-90"
                >
                  <img
                    src="/btn-close.png"
                    alt="Close"
                    className="w-full h-full [image-rendering:pixelated]"
                  />
                </button>
              </div>

              {/* Game Mechanics */}
              <div className="bg-stone-900/80 border border-stone-700 p-3 mb-3">
                <h3 className="text-amber-300 font-bold text-xs mb-2">COMBAT</h3>
                <p className="text-stone-300 text-[10px] leading-relaxed">
                  Roll 4 dice to form poker hands. Lock dice you want to keep, then re-roll.
                  Press ACT to attack with your hand. Higher combos = more damage!
                </p>
              </div>

              {/* Hand Reference */}
              <div className="bg-stone-900/80 border border-stone-700 p-3 mb-3">
                <h3 className="text-amber-300 font-bold text-xs mb-2">HANDS (Base DMG)</h3>
                <div className="space-y-1 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-amber-200">QUAD (4 same)</span>
                    <span className="text-emerald-400">3x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">STRAIGHT (4 seq)</span>
                    <span className="text-emerald-400">2.5x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TRIPS (3 same)</span>
                    <span className="text-emerald-400">2x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TWO PAIR</span>
                    <span className="text-sky-400">1.5x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">PAIR (2 same)</span>
                    <span className="text-sky-400">1x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">HIGH CARD</span>
                    <span className="text-stone-500">0.5x</span>
                  </div>
                </div>
                <p className="text-stone-500 text-[8px] mt-2 italic">* Each character has unique hand effects!</p>
              </div>

              {/* Knight Class */}
              <div className="bg-stone-900/80 border border-amber-700/50 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/player-knight.png"
                    alt="Knight"
                    className="w-10 h-10 [image-rendering:pixelated]"
                  />
                  <div>
                    <h3 className="text-amber-300 font-bold text-xs">THE KNIGHT</h3>
                    <p className="text-stone-500 text-[9px]">Tank Fighter</p>
                  </div>
                </div>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-sky-400 font-bold">Shield</span> - Build shield with strong hands.
                  Shield absorbs incoming damage before HP.
                </p>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-red-400 font-bold">Shield Bash</span> - Pair/Two Pair consume shield for bonus damage!
                </p>
                <div className="space-y-1 text-[9px] mt-2 border-t border-stone-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-amber-200">PAIR</span>
                    <span className="text-red-400">+100% shield as DMG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TWO PAIR</span>
                    <span className="text-red-400">+150% shield, keep half</span>
                  </div>
                </div>
              </div>

              {/* Mage Class */}
              <div className="bg-stone-900/80 border border-purple-700/50 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/player-mage.png"
                    alt="Mage"
                    className="w-10 h-10 [image-rendering:pixelated]"
                  />
                  <div>
                    <h3 className="text-purple-300 font-bold text-xs">THE MAGE</h3>
                    <p className="text-stone-500 text-[9px]">Arcane Caster</p>
                  </div>
                </div>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-purple-400 font-bold">Arcane Stacks</span> - Build power with small hands.
                  No shield, but massive burst potential!
                </p>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-amber-400 font-bold">Unleash</span> - Trips+ consume stacks for +25% DMG per stack!
                </p>
                <div className="space-y-1 text-[9px] mt-2 border-t border-stone-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-amber-200">PAIR</span>
                    <span className="text-purple-400">+1 Arcane Stack</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TWO PAIR</span>
                    <span className="text-purple-400">+2 Arcane Stacks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TRIPS+</span>
                    <span className="text-amber-400">Unleash! (+25%/stack)</span>
                  </div>
                </div>
              </div>

              {/* Archer Class */}
              <div className="bg-stone-900/80 border border-emerald-700/50 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/player-archer.png"
                    alt="Archer"
                    className="w-10 h-10 [image-rendering:pixelated]"
                  />
                  <div>
                    <h3 className="text-emerald-300 font-bold text-xs">THE ARCHER</h3>
                    <p className="text-stone-500 text-[9px]">Elf Hunter</p>
                  </div>
                </div>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-emerald-400 font-bold">Mark Prey</span> - Debuff enemies with marks.
                  Each mark increases damage taken!
                </p>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-red-400 font-bold">Execute</span> - Trips+ consume marks for +10% DMG per mark!
                </p>
                <div className="space-y-1 text-[9px] mt-2 border-t border-stone-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-amber-200">PAIR</span>
                    <span className="text-emerald-400">+1 Mark (+10% DMG)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TWO PAIR</span>
                    <span className="text-emerald-400">+2 Marks (+20% DMG)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TRIPS+</span>
                    <span className="text-red-400">Execute! (+10%/mark)</span>
                  </div>
                </div>
              </div>

              {/* Rogue Class */}
              <div className="bg-stone-900/80 border border-yellow-700/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/player-rogue.png"
                    alt="Rogue"
                    className="w-10 h-10 [image-rendering:pixelated]"
                  />
                  <div>
                    <h3 className="text-yellow-300 font-bold text-xs">THE ROGUE</h3>
                    <p className="text-stone-500 text-[9px]">High Roller</p>
                  </div>
                </div>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-yellow-400 font-bold">3 Rolls!</span> More chances to hit big hands.
                  Pairs and Two Pairs deal NO damage!
                </p>
                <p className="text-stone-300 text-[10px] leading-relaxed mb-2">
                  <span className="text-red-400 font-bold">High Risk</span> - Chase Trips, Straights, and Quads!
                </p>
                <div className="space-y-1 text-[9px] mt-2 border-t border-stone-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-stone-500">PAIR / HIGH CARD</span>
                    <span className="text-red-400">MISS! (0 DMG)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TWO PAIR</span>
                    <span className="text-yellow-400">1x DMG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">TRIPS</span>
                    <span className="text-yellow-400">2.5x DMG +5 HP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">STRAIGHT</span>
                    <span className="text-emerald-400">5x DMG!</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-200">QUAD</span>
                    <span className="text-green-400">JACKPOT! +20 HP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-amber-200/80 mb-4 [text-shadow:1px_1px_2px_#000]">
          Roll dice. Make combos.
          <br />
          Slay monsters.
        </p>
        <button
          onClick={openCharacterSelect}
          className="relative flex items-center gap-3 px-10 py-3 font-bold text-amber-100 text-lg tracking-widest transition-all
            bg-stone-800
            border-2 border-amber-600/80
            hover:bg-stone-700 hover:border-amber-500 hover:text-amber-50
            active:bg-stone-900
            [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]"
        >
          <img
            src="/icon-start.png"
            alt=""
            className="h-6 w-6 [image-rendering:pixelated]"
          />
          PLAY
        </button>
      </div>
    );
  }

  // Character Select Screen
  if (phase === "character-select") {
    return (
      <div
        className="flex h-full w-full flex-col items-center bg-cover bg-center relative"
        style={{
          backgroundImage: "url(/menu-bg.png)",
          imageRendering: "pixelated",
        }}
      >
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/80" />
        {/* Back button */}
        <button
          onClick={() => setPhase("title")}
          className="absolute top-3 left-3 z-10 w-10 h-10 transition-all hover:brightness-125 active:scale-90"
        >
          <img
            src="/btn-back.png"
            alt="Back"
            className="w-full h-full [image-rendering:pixelated]"
          />
        </button>

        <h2 className="text-amber-400 font-bold text-lg mt-6 mb-4 z-10 [text-shadow:2px_2px_0px_#000]">
          SELECT CHARACTER
        </h2>

        <div className="flex flex-col gap-4 px-4 w-full z-10">
          {/* Knight */}
          <button
            onClick={() => selectCharacter("knight")}
            className="flex items-center gap-3 p-3 border-2 transition-all bg-stone-900/80 border-stone-700 hover:border-amber-500 hover:bg-amber-900/40"
          >
            <img
              src="/player-knight.png"
              alt="Knight"
              className="w-16 h-16 [image-rendering:pixelated]"
            />
            <div className="flex-1 text-left">
              <h3 className="text-amber-300 font-bold text-sm">THE KNIGHT</h3>
              <p className="text-stone-400 text-[9px]">Tank Fighter</p>
              <div className="text-stone-300 text-[10px] mt-1 h-[36px]">
                <p><span className="text-sky-400">Shield</span> absorbs damage.</p>
                <p><span className="text-red-400">Bash</span> with Pairs!</p>
                <p className="text-stone-500">60 HP - Tanky</p>
              </div>
            </div>
          </button>

          {/* Mage */}
          <button
            onClick={() => selectCharacter("mage")}
            className="flex items-center gap-3 p-3 border-2 transition-all bg-stone-900/80 border-stone-700 hover:border-purple-500 hover:bg-purple-900/40"
          >
            <img
              src="/player-mage.png"
              alt="Mage"
              className="w-16 h-16 [image-rendering:pixelated]"
            />
            <div className="flex-1 text-left">
              <h3 className="text-purple-300 font-bold text-sm">THE MAGE</h3>
              <p className="text-stone-400 text-[9px]">Arcane Caster</p>
              <div className="text-stone-300 text-[10px] mt-1 h-[36px]">
                <p><span className="text-purple-400">Stack</span> arcane with Pairs.</p>
                <p><span className="text-amber-400">Unleash</span> with Trips+!</p>
                <p className="text-stone-500">35 HP - Glass Cannon</p>
              </div>
            </div>
          </button>

          {/* Archer */}
          <button
            onClick={() => selectCharacter("archer")}
            className="flex items-center gap-3 p-3 border-2 transition-all bg-stone-900/80 border-stone-700 hover:border-emerald-500 hover:bg-emerald-900/40"
          >
            <img
              src="/player-archer.png"
              alt="Archer"
              className="w-16 h-16 [image-rendering:pixelated]"
            />
            <div className="flex-1 text-left">
              <h3 className="text-emerald-300 font-bold text-sm">THE ARCHER</h3>
              <p className="text-stone-400 text-[9px]">Elf Hunter</p>
              <div className="text-stone-300 text-[10px] mt-1 h-[36px]">
                <p><span className="text-emerald-400">Mark</span> prey with Pairs.</p>
                <p><span className="text-red-400">Execute</span> with Trips+!</p>
                <p className="text-stone-500">45 HP - Balanced</p>
              </div>
            </div>
          </button>

          {/* Rogue */}
          <button
            onClick={() => selectCharacter("rogue")}
            className="flex items-center gap-3 p-3 border-2 transition-all bg-stone-900/80 border-stone-700 hover:border-yellow-500 hover:bg-yellow-900/40"
          >
            <img
              src="/player-rogue.png"
              alt="Rogue"
              className="w-16 h-16 [image-rendering:pixelated]"
            />
            <div className="flex-1 text-left">
              <h3 className="text-yellow-300 font-bold text-sm">THE ROGUE</h3>
              <p className="text-stone-400 text-[9px]">High Roller</p>
              <div className="text-stone-300 text-[10px] mt-1 h-[36px]">
                <p><span className="text-yellow-400">3 rolls!</span> Chase big hands.</p>
                <p><span className="text-red-400">Pairs miss!</span></p>
                <p className="text-stone-500">40 HP - High Risk</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-stone-500 text-[10px] mt-6 z-10">Tap a character to start</p>
      </div>
    );
  }

  // Game Over Screen
  if (phase === "game-over") {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center relative"
        style={{
          backgroundImage: "url(/bg-gameover.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* Dim overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Fallen character portrait */}
          <div className="relative h-24 w-24 opacity-70 grayscale">
            <img
              src="/ui-frame-portrait.png"
              alt=""
              className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
            />
            <img
              src={character === "knight" ? "/player-knight.png" : character === "mage" ? "/player-mage.png" : character === "archer" ? "/player-archer.png" : "/player-rogue.png"}
              alt="Fallen"
              className="absolute inset-[12%] h-[76%] w-[76%] [image-rendering:pixelated]"
            />
          </div>

          <h1 className="text-3xl font-bold text-red-500 [text-shadow:2px_2px_0px_#000,0_0_20px_rgba(239,68,68,0.5)]">
            GAME OVER
          </h1>

          <p className="text-stone-400 text-sm">You reached</p>

          <div className="border-4 border-red-900/80 bg-black/80 px-8 py-4">
            <p className="text-4xl font-bold text-amber-400 [text-shadow:2px_2px_0px_#000]">
              FLOOR {floor}
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={restart}
              className="border-2 border-amber-600 bg-amber-500/90 px-6 py-3 font-bold text-black transition-all hover:bg-amber-400 hover:border-amber-500 active:bg-amber-600"
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => setPhase("title")}
              className="border-2 border-stone-600 bg-stone-800/90 px-6 py-3 font-bold text-stone-300 transition-all hover:bg-stone-700 hover:border-stone-500 active:bg-stone-900"
            >
              MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Combat Screen
  const isBossFloor = floor % 10 === 0 && floor > 0;
  const isEliteFloor = floor % 5 === 0 && !isBossFloor && floor > 0;

  return (
    <div className="flex h-full w-full flex-col bg-black">
      {/* Enemy Section */}
      <div
        className="flex items-center justify-center gap-4 px-4 pt-16 pb-4 relative flex-grow"
        style={{
          backgroundImage: "url(/dungeon-wall.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* Floor indicator - top of enemy section */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 z-0 w-60 h-20 flex items-center justify-center"
          style={{
            backgroundImage: "url(/banner-floor.png)",
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            imageRendering: "pixelated",
          }}
        >
          <div className="flex items-center gap-1">
            {isBossFloor && (
              <img src="/icon-skull.png" alt="" className="h-4 w-4 [image-rendering:pixelated]" />
            )}
            {isEliteFloor && (
              <img src="/icon-star.png" alt="" className="h-4 w-4 [image-rendering:pixelated]" />
            )}
            <span
              className={`font-bold text-xs [text-shadow:1px_1px_2px_#000] ${
                isBossFloor ? "text-red-400" : isEliteFloor ? "text-orange-400" : "text-amber-400"
              }`}
            >
              FLOOR {floor}
            </span>
            {isBossFloor && (
              <img src="/icon-skull.png" alt="" className="h-4 w-4 [image-rendering:pixelated]" />
            )}
            {isEliteFloor && (
              <img src="/icon-star.png" alt="" className="h-4 w-4 [image-rendering:pixelated]" />
            )}
          </div>
        </div>
        {/* Bottom shadow gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        {/* Big Enemy Avatar */}
        <div className="relative h-32 w-32 shrink-0">
          <img
            src="/ui-frame-portrait-enemy.png"
            alt=""
            className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
          />
          <img
            src={enemy?.image}
            alt={enemy?.name}
            className="absolute inset-[12%] h-[76%] w-[76%] [image-rendering:pixelated]"
          />
        </div>

        {/* Enemy Stats & Actions */}
        <div className="flex flex-col gap-2 flex-1 max-w-[160px]">
          {/* Name */}
          <div className="text-sm font-bold text-stone-200 [text-shadow:1px_1px_0px_#000]">
            {enemy?.name}
          </div>

          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <div className="h-5 flex-1 bg-black p-[2px]">
              <div className="h-full w-full bg-stone-900">
                <div
                  className="h-full bg-gradient-to-b from-red-700 to-red-900 transition-all"
                  style={{
                    width: `${((enemy?.hp || 0) / (enemy?.maxHp || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-stone-300 w-12">
              {enemy?.hp}/{enemy?.maxHp}
            </span>
            {/* Enemy Shield - inline */}
            {enemyShield > 0 && (
              <div className="flex items-center gap-0.5 bg-sky-900/60 px-1 rounded">
                <img
                  src="/icon-defend.png"
                  alt="Shield"
                  className="h-4 w-4 [image-rendering:pixelated]"
                />
                <span className="text-[10px] font-bold text-sky-400">
                  {enemyShield}
                </span>
              </div>
            )}
            {/* Enemy Poison - debuff */}
            {enemyPoison > 0 && (
              <div className="flex items-center gap-0.5 bg-green-900/60 px-1 rounded">
                <img
                  src="/icon-poison.png"
                  alt="Poison"
                  className="h-4 w-4 [image-rendering:pixelated]"
                />
                <span className="text-[10px] font-bold text-green-400">
                  {enemyPoison}
                </span>
              </div>
            )}
            {/* Enemy Weaken - debuff */}
            {enemyWeaken > 0 && (
              <div className="flex items-center gap-0.5 bg-purple-900/60 px-1 rounded">
                <img
                  src="/icon-weaken.png"
                  alt="Weaken"
                  className="h-4 w-4 [image-rendering:pixelated]"
                />
                <span className="text-[10px] font-bold text-purple-400">
                  {enemyWeaken}
                </span>
              </div>
            )}
          </div>

          {/* Action Pool - always 3 rows for consistent layout */}
          {enemy && (
            <div className="flex flex-col gap-1 mt-1">
              {(() => {
                const sortedActions = [...enemy.actions].sort((a, b) => b.weight - a.weight).slice(0, 3);
                const paddedActions = [...sortedActions, ...Array(3 - sortedActions.length).fill(null)];
                return paddedActions.map((action, i) => (
                  action ? (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2 py-1 bg-stone-900/80 rounded whitespace-nowrap h-8"
                    >
                      <img
                        src={`/icon-${action.type === "skip" ? "flee" : action.type}.png`}
                        alt={action.type}
                        className="h-6 w-6 [image-rendering:pixelated] shrink-0"
                      />
                      <span
                        className={`text-[9px] font-bold w-14 shrink-0 ${
                          action.type === "attack"
                            ? "text-red-400"
                            : action.type === "defend"
                            ? "text-sky-400"
                            : action.type === "heal"
                            ? "text-green-400"
                            : action.type === "curse"
                            ? "text-purple-400"
                            : action.type === "poison"
                            ? "text-green-500"
                            : action.type === "weaken"
                            ? "text-orange-400"
                            : "text-stone-400"
                        }`}
                      >
                        {action.type === "attack"
                          ? `DMG ${action.value}`
                          : action.type === "defend"
                          ? `DEF ${action.value}`
                          : action.type === "heal"
                          ? `+${action.value} HP`
                          : action.type === "curse"
                          ? `-${action.value} MAX`
                          : action.type === "poison"
                          ? `PSN ${action.value}`
                          : action.type === "weaken"
                          ? `WKN ${action.value}`
                          : "FLEE"}
                      </span>
                      <div className="w-10 h-2 bg-black rounded-sm overflow-hidden shrink-0">
                        <div
                          className={`h-full ${
                            action.type === "attack"
                              ? "bg-red-600"
                              : action.type === "defend"
                              ? "bg-sky-600"
                              : action.type === "heal"
                              ? "bg-green-600"
                              : action.type === "curse"
                              ? "bg-purple-600"
                              : action.type === "poison"
                              ? "bg-green-700"
                              : action.type === "weaken"
                              ? "bg-orange-600"
                              : "bg-stone-600"
                          }`}
                          style={{ width: `${action.weight}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-stone-500">
                        {action.weight}%
                      </span>
                    </div>
                  ) : (
                    <div key={i} className="h-8" />
                  )
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Dice Tray Section */}
      <div
        className="w-full flex flex-col items-center py-3 px-3 relative flex-grow"
        style={{
          backgroundImage: "url(/dice-tray-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          backgroundColor: "#2c1810",
        }}
      >
        {/* Top shadow gradient */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        {/* Bottom shadow gradient */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        {/* Feedback Box - always 2 lines */}
        <div
          className="mx-auto flex h-14 w-full max-w-[240px] flex-col items-center justify-center relative mb-8 z-10"
          style={{
            backgroundImage: "url(/parchment.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
          }}
        >
          {lastHand && lastEnemyAction ? (
            <>
              <div className="text-[10px] font-bold text-emerald-800">
                {lastHand} → {lastDamage} DMG
              </div>
              <div
                className={`text-[10px] font-bold flex items-center gap-1 ${
                  lastEnemyAction.action === "attack"
                    ? "text-red-800"
                    : lastEnemyAction.action === "defend"
                    ? "text-sky-800"
                    : lastEnemyAction.action === "heal"
                    ? "text-green-800"
                    : lastEnemyAction.action === "curse"
                    ? "text-purple-800"
                    : "text-stone-700"
                }`}
              >
                <img
                  src={`/icon-${
                    lastEnemyAction.action === "skip"
                      ? "flee"
                      : lastEnemyAction.action
                  }.png`}
                  alt=""
                  className="h-4 w-4 [image-rendering:pixelated]"
                />
                {feedbackText}
              </div>
            </>
          ) : lastHand ? (
            <>
              <div className="text-sm font-bold text-black">{lastHand}</div>
              <div className="text-[10px] font-bold text-emerald-800">
                {lastDamage} DMG
              </div>
            </>
          ) : (
            <div className="text-xs text-stone-700">Roll the dice!</div>
          )}
        </div>

        <div className="flex justify-center gap-3 mb-4">
          {dice.map((value, i) => (
            <div key={`dice-${i}-${value}`} className="flex flex-col items-center">
              <button
                onClick={toggleLock(i)}
                type="button"
                className={`flex h-14 w-14 items-center justify-center rounded select-none transition-all ${
                  locked[i]
                    ? "bg-amber-900/60 shadow-[0_0_12px_rgba(251,191,36,0.6),inset_0_0_8px_rgba(251,191,36,0.3)]"
                    : "bg-stone-900/80 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]"
                } ${
                  !hasRolled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:bg-stone-800/90 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                }`}
              >
                <img
                  src={DICE_IMAGES[value - 1]}
                  alt={`Dice ${value}`}
                  className="h-10 w-10 [image-rendering:pixelated] pointer-events-none"
                />
              </button>
              <img
                src="/icon-lock.png"
                alt="Locked"
                className={`h-5 w-5 mt-1 [image-rendering:pixelated] transition-opacity ${
                  locked[i] ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Current Hand Indicator - always takes space */}
        {(() => {
          const hand = hasRolled ? detectHand(dice) : null;

          // Knight mechanics
          const isBash = character === "knight" && hand && (hand.type === "pair" || hand.type === "two-pair") && shield > 0;
          const bashDamage = isBash
            ? hand.type === "pair"
              ? shield
              : Math.floor(shield * 1.5)
            : 0;

          // Mage mechanics
          const isStacking = character === "mage" && hand && (hand.type === "pair" || hand.type === "two-pair");
          const stackGain = isStacking ? (hand.type === "pair" ? 1 : 2) : 0;
          const isUnleash = character === "mage" && hand && hand.rank >= 3 && arcaneStacks > 0;
          const unleashBonus = isUnleash
            ? Math.floor(dice.reduce((a, b) => a + b, 0) * DAMAGE_MULTIPLIERS[hand.type] * arcaneStacks * 0.35)
            : 0;

          // Archer mechanics
          const isMarking = character === "archer" && hand && (hand.type === "pair" || hand.type === "two-pair");
          const markGain = isMarking ? (hand.type === "pair" ? 1 : 2) : 0;
          const isExecute = character === "archer" && hand && hand.rank >= 3 && markStacks > 0;
          const isLethalExecute = isExecute && enemy && enemy.hp <= enemy.maxHp * 0.45;
          const executeBonus = isExecute && !isLethalExecute
            ? Math.floor(dice.reduce((a, b) => a + b, 0) * DAMAGE_MULTIPLIERS[hand.type] * markStacks * 0.4)
            : 0;

          // Rogue mechanics
          const isMiss = character === "rogue" && hand && (hand.type === "pair" || hand.type === "sum");
          const isTwoPairRogue = character === "rogue" && hand && hand.type === "two-pair";
          const isJackpot = character === "rogue" && hand && hand.type === "quad";
          const isStraightHit = character === "rogue" && hand && hand.type === "straight";
          const isTripsHit = character === "rogue" && hand && hand.type === "three-kind";

          // Determine color class
          let colorClass = "text-stone-400";
          if (!hasRolled) {
            colorClass = "text-transparent";
          } else if (isBash) {
            colorClass = "text-red-400 animate-pulse";
          } else if (isUnleash) {
            colorClass = "text-amber-300 animate-pulse";
          } else if (isExecute) {
            colorClass = "text-red-400 animate-pulse";
          } else if (isStacking) {
            colorClass = "text-purple-400";
          } else if (isMarking) {
            colorClass = "text-emerald-400";
          } else if (isMiss) {
            colorClass = "text-red-500";
          } else if (isTwoPairRogue) {
            colorClass = "text-yellow-400";
          } else if (isJackpot) {
            colorClass = "text-green-400 animate-pulse";
          } else if (isStraightHit) {
            colorClass = "text-yellow-300 animate-pulse";
          } else if (isTripsHit) {
            colorClass = "text-yellow-400";
          } else if (hand!.rank >= 4) {
            colorClass = "text-amber-300 animate-pulse";
          } else if (hand!.rank >= 3) {
            colorClass = "text-amber-400";
          } else if (hand!.rank >= 2) {
            colorClass = "text-emerald-400";
          } else if (hand!.rank >= 1) {
            colorClass = "text-sky-400";
          }

          return (
            <div className={`text-center font-bold text-sm mb-2 h-5 [text-shadow:1px_1px_2px_#000] ${colorClass}`}>
              {hasRolled && hand ? (
                isBash ? (
                  <>
                    BASH!
                    <span className="text-[10px] ml-1 opacity-70">(+{bashDamage} DMG)</span>
                  </>
                ) : isStacking ? (
                  <>
                    +{stackGain} ARCANE
                    <span className="text-[10px] ml-1 opacity-70">(building...)</span>
                  </>
                ) : isUnleash ? (
                  <>
                    UNLEASH!
                    <span className="text-[10px] ml-1 opacity-70">(+{unleashBonus} DMG +{arcaneStacks * 2} HP)</span>
                  </>
                ) : isMarking ? (
                  <>
                    +{markGain} MARK +{markGain === 1 ? 3 : 4} PSN +{markGain === 1 ? 4 : 6} HP
                    <span className="text-[10px] ml-1 opacity-70">(+{markGain * 40}%)</span>
                  </>
                ) : isLethalExecute ? (
                  <>
                    EXECUTE!
                    <span className="text-[10px] ml-1 opacity-70 text-red-400">(LETHAL)</span>
                  </>
                ) : isExecute ? (
                  <>
                    EXECUTE!
                    <span className="text-[10px] ml-1 opacity-70">(+{executeBonus} DMG)</span>
                  </>
                ) : isMiss ? (
                  <>
                    GRAZE
                    <span className="text-[10px] ml-1 opacity-70">(0.75x +3 HP)</span>
                  </>
                ) : isTwoPairRogue ? (
                  <>
                    TWO PAIR
                    <span className="text-[10px] ml-1 opacity-70">(2x DMG)</span>
                  </>
                ) : isJackpot ? (
                  <>
                    JACKPOT!
                    <span className="text-[10px] ml-1 opacity-70">(2x +30 HP)</span>
                  </>
                ) : isStraightHit ? (
                  <>
                    STRAIGHT!
                    <span className="text-[10px] ml-1 opacity-70">(6x +5 PSN!)</span>
                  </>
                ) : isTripsHit ? (
                  <>
                    TRIPS!
                    <span className="text-[10px] ml-1 opacity-70">(3x +12 HP +2 WKN)</span>
                  </>
                ) : character === "knight" ? (
                  <>
                    {HAND_NAMES[hand.type]}
                    <span className="text-[10px] ml-1 opacity-70">(+{SHIELD_GAINS[hand.type]} 🛡)</span>
                  </>
                ) : (
                  <>
                    {HAND_NAMES[hand.type]}
                  </>
                )
              ) : (
                "\u00A0"
              )}
            </div>
          );
        })()}

        {/* Lock hint */}
        <div className="text-center text-[10px] text-stone-400 mb-4">
          {hasRolled ? "tap dice to lock" : "roll first"}
        </div>
      </div>

      {/* Bottom Section - Player */}
      <div
        className="p-3 relative"
        style={{
          backgroundImage: "url(/wood-panel.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* Top shadow gradient */}
        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        {/* Player Avatar + Stats Row */}
        <div className="flex items-center gap-4">
          {/* Big Avatar */}
          <div className="relative h-24 w-24 shrink-0">
            <img
              src="/ui-frame-portrait.png"
              alt=""
              className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
            />
            <img
              src={character === "knight" ? "/player-knight.png" : character === "mage" ? "/player-mage.png" : character === "archer" ? "/player-archer.png" : "/player-rogue.png"}
              alt={character === "knight" ? "Knight" : character === "mage" ? "Mage" : character === "archer" ? "Archer" : "Rogue"}
              className="absolute inset-[12%] h-[76%] w-[76%] [image-rendering:pixelated]"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-1 flex-col gap-2">
            {/* Class Name + Status */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold [text-shadow:1px_1px_0px_#000] ${
                character === "knight" ? "text-amber-400" : character === "mage" ? "text-purple-400" : character === "archer" ? "text-emerald-400" : "text-yellow-400"
              }`}>
                {character === "knight" ? "Knight" : character === "mage" ? "Mage" : character === "archer" ? "Archer" : "Rogue"}
              </span>
              {/* Status indicators */}
              {damageBonus > 0 && (
                <div className="flex items-center gap-0.5 bg-amber-900/50 px-1 rounded">
                  <img src="/icon-damage.png" alt="DMG" className="h-4 w-4 [image-rendering:pixelated]" />
                  <span className="text-[9px] font-bold text-amber-400">+{damageBonus}</span>
                </div>
              )}
              {poisonStacks > 0 && (
                <div className="flex items-center gap-0.5 bg-green-900/50 px-1 rounded animate-pulse">
                  <img src="/icon-poison.png" alt="PSN" className="h-4 w-4 [image-rendering:pixelated]" />
                  <span className="text-[9px] font-bold text-green-400">{poisonStacks}</span>
                </div>
              )}
              {weakenTurns > 0 && (
                <div className="flex items-center gap-0.5 bg-orange-900/50 px-1 rounded animate-pulse">
                  <img src="/icon-weaken.png" alt="WKN" className="h-4 w-4 [image-rendering:pixelated]" />
                  <span className="text-[9px] font-bold text-orange-400">{weakenTurns}</span>
                </div>
              )}
            </div>
            {/* HP Bar */}
            <div className="flex items-center gap-2">
              <img
                src="/icon-health.png"
                alt="HP"
                className="h-7 w-7 [image-rendering:pixelated]"
              />
              <div className="h-5 flex-1 bg-black p-[2px]">
                <div className="h-full w-full bg-stone-900">
                  <div
                    className="h-full bg-gradient-to-b from-red-700 to-red-900 transition-all"
                    style={{ width: `${(hp / maxHp) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold text-stone-300 w-12">
                {hp}/{maxHp}
              </span>
            </div>
            {/* Secondary Resource Bar */}
            {character === "knight" ? (
              <div className="flex items-center gap-2">
                <img
                  src="/icon-defend.png"
                  alt="Shield"
                  className="h-7 w-7 [image-rendering:pixelated]"
                />
                <div className="h-5 flex-1 bg-black p-[2px]">
                  <div className="h-full w-full bg-stone-900">
                    <div
                      className="h-full bg-gradient-to-b from-sky-600 to-sky-800 transition-all"
                      style={{ width: `${Math.min(shield / 20, 1) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-stone-300 w-12">
                  {shield}
                </span>
              </div>
            ) : character === "mage" ? (
              <div className="flex items-center gap-2">
                <img
                  src="/icon-curse.png"
                  alt="Arcane"
                  className="h-7 w-7 [image-rendering:pixelated]"
                />
                <div className="flex gap-1 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 flex-1 border-2 transition-all ${
                        i < arcaneStacks
                          ? "bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                          : "bg-stone-900 border-stone-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-purple-300 w-12">
                  {arcaneStacks}/5
                </span>
              </div>
            ) : character === "archer" ? (
              <div className="flex items-center gap-2">
                <img
                  src="/icon-attack.png"
                  alt="Marks"
                  className="h-7 w-7 [image-rendering:pixelated]"
                />
                <div className="flex gap-1 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 flex-1 border-2 transition-all ${
                        i < markStacks
                          ? "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                          : "bg-stone-900 border-stone-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-emerald-300 w-12">
                  {markStacks}/5
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold text-xs [text-shadow:1px_1px_0px_#000]">
                  HIGH ROLLER
                </span>
                <div className="flex gap-1 flex-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-5 flex-1 border-2 transition-all ${
                        i < rollsLeft
                          ? "bg-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                          : "bg-stone-900 border-stone-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-yellow-300 w-12">
                  {rollsLeft}/3
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-3">
          <button
            onClick={act}
            disabled={!hasRolled}
            className="flex-1 h-20 transition-transform disabled:opacity-50 hover:brightness-110 active:scale-95 active:brightness-90"
          >
            <img
              src="/btn-act.png"
              alt="ACT"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          </button>
          <button
            onClick={roll}
            disabled={rollsLeft === 0}
            className="flex-1 h-20 relative transition-transform disabled:opacity-50 hover:brightness-110 active:scale-95 active:brightness-90"
          >
            <img
              src="/btn-roll.png"
              alt="ROLL"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
            <span className="absolute inset-0 flex items-center justify-center font-bold text-stone-200 text-sm [text-shadow:1px_1px_2px_#000]">
              ROLL ({rollsLeft})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
