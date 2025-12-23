// Next, React
import { FC, useState } from "react";
import pkg from "../../../package.json";

// DO NOT EDIT ANYTHING ABOVE THIS LINE

export const HomeView: FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
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
  const baseHp = 15;
  const scaledHp = Math.floor(baseHp + floor * 1.5);
  const baseDamage = 6;
  const scaledDamage = Math.floor(baseDamage + floor * 0.5);

  return {
    name: "Skeleton",
    image: "/skeleton.png",
    hp: scaledHp,
    maxHp: scaledHp,
    actions: [
      { type: "attack", value: scaledDamage, weight: 70 },
      { type: "defend", value: 5, weight: 30 },
    ],
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
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,#1a1a2e_0%,#0f0f1a_100%)]">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/dice-6.png"
            alt="Dice"
            className="h-20 w-20 [image-rendering:pixelated]"
          />
        </div>
        <h1 className="font-bold text-3xl text-amber-400 [text-shadow:2px_2px_0px_#000,_-1px_-1px_0px_#000]">
          DICE DELVER
        </h1>
        <p className="text-center text-sm text-stone-400">
          Roll dice. Make combos.
          <br />
          Slay monsters.
        </p>
        <button
          onClick={startGame}
          className="mt-4 border-b-4 border-amber-700 bg-amber-500 px-8 py-3 font-bold text-black transition-all hover:bg-amber-400 hover:border-amber-600 active:border-b-0 active:border-t-4 active:border-t-amber-700"
        >
          START
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
  return (
    <div className="flex h-full w-full flex-col bg-black">
      {/* Floor Header */}
      <div className="bg-stone-900/80 py-1 text-center font-bold text-amber-400 [text-shadow:1px_1px_0px_#000]">
        FLOOR {floor}
      </div>

      {/* Enemy Section */}
      <div
        className="flex flex-col items-center py-8 relative flex-grow"
        style={{
          backgroundImage: "url(/dungeon-wall.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        <div className="border-4 border-stone-700 bg-stone-900/60 p-3">
          <img
            src={enemy?.image}
            alt={enemy?.name}
            className="h-16 w-16 [image-rendering:pixelated]"
          />
        </div>
        <div className="mt-1 text-xs font-bold text-stone-300 [text-shadow:1px_1px_0px_#000]">
          {enemy?.name}
        </div>
        {/* Enemy HP Bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-3 w-28 border-2 border-stone-600 bg-stone-800">
            <div
              className="h-full bg-rose-600 transition-all"
              style={{
                width: `${((enemy?.hp || 0) / (enemy?.maxHp || 1)) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-bold text-stone-300">
            {enemy?.hp}/{enemy?.maxHp}
          </span>
        </div>
        {/* Enemy Shield */}
        {enemyShield > 0 && (
          <div className="mt-1 text-xs font-bold text-sky-400">
            🛡️ {enemyShield}
          </div>
        )}

        {/* Enemy Actions List */}
        {enemy && (
          <div className="mt-2 w-full max-w-[220px] border-2 border-stone-600 bg-stone-900/80 p-2">
            <div className="text-[10px] font-bold text-stone-400 mb-1">
              ACTIONS:
            </div>
            {enemy.actions.map((action, i) => (
              <div
                key={i}
                className="text-xs font-bold text-stone-300 flex justify-between items-center"
              >
                <span>
                  {action.type === "attack" && (
                    <span className="text-red-400">⚔️ ATK {action.value}</span>
                  )}
                  {action.type === "defend" && (
                    <span className="text-sky-400">🛡️ DEF {action.value}</span>
                  )}
                  {action.type === "heal" && (
                    <span className="text-green-400">
                      💚 HEAL {action.value}
                    </span>
                  )}
                  {action.type === "curse" && (
                    <span className="text-purple-400">
                      💀 CURSE {action.value}
                    </span>
                  )}
                  {action.type === "skip" && (
                    <span className="text-slate-400">💨 FLEE</span>
                  )}
                </span>
                <span className="text-stone-500 text-[10px]">
                  ({action.weight}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stone Divider */}
      <div
        className="w-full h-8"
        style={{
          backgroundImage: "url(/stone-divider.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      />

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
        {/* Feedback Box */}
        <div
          className="mx-auto flex h-14 w-full max-w-[200px] flex-col items-center justify-center relative mb-12"
          style={{
            backgroundImage: "url(/parchment.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            imageRendering: "pixelated",
          }}
        >
          {lastHand && (
            <>
              <div className="text-sm font-bold text-black">{lastHand}</div>
              <div className="text-xs font-bold text-stone-900">
                inflict {lastDamage}
              </div>
            </>
          )}
          {feedbackText && !lastHand && (
            <div className="text-sm font-bold text-stone-900">{feedbackText}</div>
          )}
          {!lastHand && !feedbackText && (
            <div className="text-xs text-stone-700">Roll the dice!</div>
          )}
        </div>

        <div className="flex justify-center gap-3 mb-10">
          {dice.map((value, i) => (
            <button
              key={`dice-${i}-${value}`}
              onClick={toggleLock(i)}
              type="button"
              className={`flex h-14 w-14 items-center justify-center border-4 select-none ${
                locked[i]
                  ? "border-amber-400 bg-amber-900/50 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  : "border-stone-600 bg-stone-800"
              } ${
                !hasRolled
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer hover:border-stone-400 active:bg-stone-700"
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
        className="bg-stone-900/80 p-2 relative"
        style={{
          backgroundImage: "url(/wood-panel.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      >
        {/* Player Avatar + Stats Row */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-14 w-14 items-center justify-center border-4 border-stone-600 bg-stone-800">
            <img
              src="/player-knight.png"
              alt="Knight"
              className="h-11 w-11 [image-rendering:pixelated]"
            />
          </div>

          {/* HP and Shield Bars */}
          <div className="flex flex-1 flex-col gap-1">
            {/* HP Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs">❤️</span>
              <div className="h-4 flex-1 border-2 border-stone-600 bg-stone-800">
                <div
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${(hp / maxHp) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-stone-300">
                {hp}/{maxHp}
              </span>
            </div>
            {/* Shield Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs">🛡️</span>
              <div className="h-4 flex-1 border-2 border-stone-600 bg-stone-800">
                <div
                  className="h-full bg-sky-500 transition-all"
                  style={{ width: `${Math.min(shield / 20, 1) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-stone-300">{shield}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={act}
            disabled={!hasRolled}
            className="flex-1 border-b-4 border-emerald-800 bg-emerald-600 py-2 font-bold transition-all hover:bg-emerald-500 active:border-b-0 active:border-t-4 active:border-t-emerald-800 disabled:opacity-50 disabled:border-b-4"
          >
            ⚔️ ACT
          </button>
          <button
            onClick={roll}
            disabled={rollsLeft === 0}
            className="flex-1 border-b-4 border-stone-800 bg-stone-600 py-2 font-bold transition-all hover:bg-stone-500 active:border-b-0 active:border-t-4 active:border-t-stone-800 disabled:opacity-50 disabled:border-b-4"
          >
            🎲 ROLL ({rollsLeft})
          </button>
        </div>
      </div>
    </div>
  );
};
