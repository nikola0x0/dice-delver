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
const PLAYER_MAX_HP = 50;
const STARTING_ROLLS = 2;
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
  "three-kind": "THREE OF A KIND!",
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
type Phase = "title" | "combat" | "game-over";
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
  type: "attack" | "defend" | "heal" | "curse" | "skip";
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
  action: "attack" | "defend" | "heal" | "curse" | "skip";
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
];

const BOSS_TEMPLATE: EnemyTemplate = {
  name: "Bone Lord",
  image: "/bone-lord.png",
  baseHp: 40,
  baseDamage: 12,
  actions: (dmg) => [
    { type: "attack", value: dmg, weight: 60 },
    { type: "defend", value: 15, weight: 40 },
  ],
  weight: "boss",
};

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
  // Boss every 10 floors
  const isBoss = floor % 10 === 0 && floor > 0;

  let template: EnemyTemplate;

  if (isBoss) {
    template = BOSS_TEMPLATE;
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

  // Scale stats based on floor
  const scaledHp = Math.floor(template.baseHp + floor * (isBoss ? 2 : 1.5));
  const scaledDamage = Math.floor(template.baseDamage + floor * 0.5);

  return {
    name: template.name,
    image: template.image,
    hp: scaledHp,
    maxHp: scaledHp,
    actions: template.actions(scaledDamage),
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

  // Player state
  const [hp, setHp] = useState(PLAYER_MAX_HP);
  const [maxHp, setMaxHp] = useState(PLAYER_MAX_HP);
  const [shield, setShield] = useState(0);

  // Dice state
  const [dice, setDice] = useState([1, 1, 1, 1]);
  const [locked, setLocked] = useState([false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState(STARTING_ROLLS);
  const [hasRolled, setHasRolled] = useState(false);

  // Enemy state
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  const [enemyShield, setEnemyShield] = useState(0);
  const [intent, setIntent] = useState<Intent | null>(null);

  // Feedback state
  const [lastHand, setLastHand] = useState<string | null>(null);
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [lastEnemyAction, setLastEnemyAction] = useState<Intent | null>(null);

  // === ACTIONS ===
  const startGame = () => {
    setPhase("combat");
    setFloor(1);
    setHp(PLAYER_MAX_HP);
    setMaxHp(PLAYER_MAX_HP);
    setShield(0);
    setDice([1, 1, 1, 1]);
    setLocked([false, false, false, false]);
    setRollsLeft(STARTING_ROLLS);
    setHasRolled(false);
    setLastHand(null);
    setLastDamage(null);
    setFeedbackText(null);
    setLastEnemyAction(null);

    const newEnemy = spawnEnemy(1);
    setEnemy(newEnemy);
    setEnemyShield(0);
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

    // Detect hand and calculate damage
    const hand = detectHand(dice);
    const sum = dice.reduce((a, b) => a + b, 0);
    const damage = Math.floor(sum * DAMAGE_MULTIPLIERS[hand.type]);
    const shieldGain = SHIELD_GAINS[hand.type];

    setLastHand(HAND_NAMES[hand.type]);
    setLastDamage(damage);
    setShield((s) => s + shieldGain);

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
      enemyTurn();
    }
  };

  const enemyTurn = () => {
    if (!intent) return;

    // Track what enemy did (keep lastHand to show player result too)
    setLastEnemyAction(intent);

    if (intent.action === "attack") {
      // Apply damage (shield absorbs first)
      let damage = intent.value;
      if (shield > 0) {
        if (shield >= damage) {
          setShield(shield - damage);
          setFeedbackText(`Shield blocks ${damage}!`);
          damage = 0;
        } else {
          damage = damage - shield;
          setFeedbackText(`Shield breaks! -${damage} HP`);
          setShield(0);
        }
      } else {
        setFeedbackText(`-${damage} HP`);
      }

      const newHp = hp - damage;
      setHp(newHp);

      if (newHp <= 0) {
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
      if (hp > newMaxHp) {
        setHp(newMaxHp);
      }
      setFeedbackText(`Cursed! Max HP -${intent.value}`);
    } else if (intent.action === "skip") {
      // Enemy does nothing
      setFeedbackText("Enemy fled!");
    }

    // Reset for next turn
    setLocked([false, false, false, false]);
    setRollsLeft(STARTING_ROLLS);
    setHasRolled(false);
    if (enemy) {
      setIntent(rollIntent(enemy));
    }
  };

  const nextFloor = () => {
    const newFloor = floor + 1;
    setFloor(newFloor);
    setFeedbackText("VICTORY!");

    const newEnemy = spawnEnemy(newFloor);
    setEnemy(newEnemy);
    setEnemyShield(0);
    setIntent(rollIntent(newEnemy));

    setDice([1, 1, 1, 1]);
    setLocked([false, false, false, false]);
    setRollsLeft(STARTING_ROLLS);
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
        className="flex h-full w-full flex-col items-center justify-end pb-16 bg-cover bg-center"
        style={{
          backgroundImage: "url(/menu-bg.png)",
          imageRendering: "pixelated",
        }}
      >
        <p className="text-center text-sm text-amber-200/80 mb-4 [text-shadow:1px_1px_2px_#000]">
          Roll dice. Make combos.
          <br />
          Slay monsters.
        </p>
        <button
          onClick={startGame}
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
          START
        </button>
        <button
          disabled
          className="relative flex items-center gap-3 px-8 py-2 mt-3 font-bold text-stone-400 text-sm tracking-wide transition-all
            bg-stone-900
            border-2 border-stone-700
            opacity-50 cursor-not-allowed
            [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]"
        >
          <img
            src="/icon-character.png"
            alt=""
            className="h-5 w-5 [image-rendering:pixelated] opacity-60"
          />
          CHARACTER
        </button>
      </div>
    );
  }

  // Game Over Screen
  if (phase === "game-over") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,#2a1a1a_0%,#0f0f1a_100%)]">
        <img
          src="/skeleton.png"
          alt="Death"
          className="h-20 w-20 [image-rendering:pixelated] opacity-80"
        />
        <h1 className="text-2xl font-bold text-red-500 [text-shadow:2px_2px_0px_#000]">
          GAME OVER
        </h1>
        <p className="text-stone-400">You reached</p>
        <div className="border-4 border-stone-700 bg-stone-900 px-6 py-3">
          <p className="text-3xl font-bold text-amber-400 [text-shadow:2px_2px_0px_#000]">
            FLOOR {floor}
          </p>
        </div>
        <button
          onClick={restart}
          className="mt-4 border-b-4 border-amber-700 bg-amber-500 px-8 py-3 font-bold text-black transition-all hover:bg-amber-400 hover:border-amber-600 active:border-b-0 active:border-t-4 active:border-t-amber-700"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  // Combat Screen
  const isBossFloor = floor % 10 === 0 && floor > 0;

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
            <span
              className={`font-bold text-xs [text-shadow:1px_1px_2px_#000] ${
                isBossFloor ? "text-red-400" : "text-amber-400"
              }`}
            >
              FLOOR {floor}
            </span>
            {isBossFloor && (
              <img src="/icon-skull.png" alt="" className="h-4 w-4 [image-rendering:pixelated]" />
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
          </div>

          {/* Action Pool - what enemy MIGHT do */}
          {enemy && (
            <div className="flex flex-col gap-1 mt-1">
              {enemy.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1 bg-stone-900/80 rounded whitespace-nowrap"
                  title={
                    action.type === "attack"
                      ? `Deals ${action.value} damage to you`
                      : action.type === "defend"
                      ? `Gains ${action.value} shield`
                      : action.type === "heal"
                      ? `Restores ${action.value} HP`
                      : action.type === "curse"
                      ? `Reduces your max HP by ${action.value}`
                      : "Skips turn"
                  }
                >
                  <img
                    src={`/icon-${
                      action.type === "skip" ? "flee" : action.type
                    }.png`}
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
                          : "bg-stone-600"
                      }`}
                      style={{ width: `${action.weight}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-stone-500">
                    {action.weight}%
                  </span>
                </div>
              ))}
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

        <div className="flex justify-center gap-3 mb-10">
          {dice.map((value, i) => (
            <button
              key={`dice-${i}-${value}`}
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
          ))}
        </div>

        {/* Lock hint */}
        <div className="text-center text-[10px] text-stone-300 mb-6">
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
              src="/player-knight.png"
              alt="Knight"
              className="absolute inset-[12%] h-[76%] w-[76%] [image-rendering:pixelated]"
            />
          </div>

          {/* Stats */}
          <div className="flex flex-1 flex-col gap-2">
            {/* Class Name */}
            <div className="text-sm font-bold text-amber-400 [text-shadow:1px_1px_0px_#000]">
              Knight
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
            {/* Shield Bar */}
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
