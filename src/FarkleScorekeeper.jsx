import React, { useState, useEffect, useRef } from "react";
import { Trophy, Moon, Sun, X, Check, RotateCcw, Plus, HelpCircle } from "lucide-react";
import { storage } from "./storage";

const WIN_SCORE = 10000;
const MAX_PLAYERS = 6;

const PLAYER_COLORS = [
  { key: "blue", label: "Blue" },
  { key: "orange", label: "Orange" },
  { key: "emerald", label: "Teal" },
  { key: "red", label: "Crimson" },
  { key: "violet", label: "Purple" },
  { key: "yellow", label: "Yellow" },
];

const COLOR_MAP = {
  blue: {
    solid: "bg-blue-600",
    hoverSolid: "hover:bg-blue-700",
    textLight: "text-blue-600",
    textDark: "text-blue-400",
    border: "border-blue-600",
    ring: "ring-blue-600",
    softLight: "bg-blue-50",
    softDark: "bg-blue-950/40",
    swatch: "bg-blue-600",
  },
  orange: {
    solid: "bg-orange-600",
    hoverSolid: "hover:bg-orange-700",
    textLight: "text-orange-600",
    textDark: "text-orange-400",
    border: "border-orange-600",
    ring: "ring-orange-600",
    softLight: "bg-orange-50",
    softDark: "bg-orange-950/40",
    swatch: "bg-orange-600",
  },
  emerald: {
    solid: "bg-emerald-600",
    hoverSolid: "hover:bg-emerald-700",
    textLight: "text-emerald-600",
    textDark: "text-emerald-400",
    border: "border-emerald-600",
    ring: "ring-emerald-600",
    softLight: "bg-emerald-50",
    softDark: "bg-emerald-950/40",
    swatch: "bg-emerald-600",
  },
  red: {
    solid: "bg-red-600",
    hoverSolid: "hover:bg-red-700",
    textLight: "text-red-600",
    textDark: "text-red-400",
    border: "border-red-600",
    ring: "ring-red-600",
    softLight: "bg-red-50",
    softDark: "bg-red-950/40",
    swatch: "bg-red-600",
  },
  violet: {
    solid: "bg-violet-600",
    hoverSolid: "hover:bg-violet-700",
    textLight: "text-violet-600",
    textDark: "text-violet-400",
    border: "border-violet-600",
    ring: "ring-violet-600",
    softLight: "bg-violet-50",
    softDark: "bg-violet-950/40",
    swatch: "bg-violet-600",
  },
  yellow: {
    solid: "bg-yellow-600",
    hoverSolid: "hover:bg-yellow-700",
    textLight: "text-yellow-600",
    textDark: "text-yellow-400",
    border: "border-yellow-600",
    ring: "ring-yellow-600",
    softLight: "bg-yellow-50",
    softDark: "bg-yellow-950/40",
    swatch: "bg-yellow-600",
  },
};

const QUICK_SCORES = [
  50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 750, 1000, 1500, 2000, 2500, 3000,
];

function genId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getColor(key, isDark) {
  const c = COLOR_MAP[key] || COLOR_MAP.blue;
  return {
    solid: c.solid,
    hoverSolid: c.hoverSolid,
    text: isDark ? c.textDark : c.textLight,
    border: c.border,
    ring: c.ring,
    soft: isDark ? c.softDark : c.softLight,
    swatch: c.swatch,
  };
}

function getTheme(isDark) {
  return isDark
    ? {
        pageBg: "bg-neutral-950",
        pageText: "text-neutral-100",
        card: "bg-neutral-900",
        cardBorder: "border-neutral-800",
        muted: "text-neutral-400",
        faint: "text-neutral-600",
        hoverNeutral: "hover:bg-neutral-800",
        iconHover: "hover:bg-neutral-800",
        inputBorder: "border-neutral-700",
        dashedBorder: "border-neutral-700",
        primaryBtn: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        bannerBg: "bg-amber-950/40",
        bannerBorder: "border-amber-800",
        badgeBg: "bg-amber-950/60",
        badgeText: "text-amber-400",
        ringOffset: "ring-offset-neutral-900",
      }
    : {
        pageBg: "bg-neutral-50",
        pageText: "text-neutral-900",
        card: "bg-white",
        cardBorder: "border-neutral-200",
        muted: "text-neutral-500",
        faint: "text-neutral-400",
        hoverNeutral: "hover:bg-neutral-100",
        iconHover: "hover:bg-neutral-200",
        inputBorder: "border-neutral-300",
        dashedBorder: "border-neutral-300",
        primaryBtn: "bg-neutral-900 text-white hover:bg-neutral-800",
        bannerBg: "bg-amber-50",
        bannerBorder: "border-amber-300",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
        ringOffset: "ring-offset-white",
      };
}

export default function FarkleScorekeeper() {
  const [storageReady, setStorageReady] = useState(false);
  const [theme, setTheme] = useState("light");
  const [savedPlayers, setSavedPlayers] = useState([]);

  const [screen, setScreen] = useState("setup");
  const [players, setPlayers] = useState([]);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentTurnScore, setCurrentTurnScore] = useState(0);
  const [customScoreInput, setCustomScoreInput] = useState("");
  const [gamePhase, setGamePhase] = useState("playing");
  const [finalRoundRemaining, setFinalRoundRemaining] = useState([]);
  const [finalRoundTriggeredBy, setFinalRoundTriggeredBy] = useState(null);
  const [turnLog, setTurnLog] = useState([]);
  const [turnCounter, setTurnCounter] = useState(0);
  const [winner, setWinner] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [lastTurnSnapshot, setLastTurnSnapshot] = useState(null);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerColor, setNewPlayerColor] = useState(PLAYER_COLORS[0].key);

  const nameInputRef = useRef(null);

  const isDark = theme === "dark";
  const T = getTheme(isDark);

  useEffect(() => {
    (async () => {
      try {
        const result = await storage.get("preferences");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (parsed.theme) setTheme(parsed.theme);
          if (Array.isArray(parsed.savedPlayers)) setSavedPlayers(parsed.savedPlayers);
        }
      } catch (e) {
        // no saved preferences yet
      }
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    (async () => {
      try {
        await storage.set("preferences", JSON.stringify({ theme, savedPlayers }));
      } catch (e) {
        console.error("Could not save preferences", e);
      }
    })();
  }, [theme, savedPlayers, storageReady]);

  function usedColors(list) {
    return new Set(list.map((p) => p.colorKey));
  }

  function nextAvailableColor(list) {
    const used = usedColors(list);
    const found = PLAYER_COLORS.find((c) => !used.has(c.key));
    return found ? found.key : PLAYER_COLORS[0].key;
  }

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name || players.length >= MAX_PLAYERS) return;
    const updated = [...players, { id: genId(), name, colorKey: newPlayerColor, score: 0 }];
    setPlayers(updated);
    setNewPlayerName("");
    setNewPlayerColor(nextAvailableColor(updated));
    if (nameInputRef.current) nameInputRef.current.focus();
  }

  function addSavedPlayer(sp) {
    if (players.length >= MAX_PLAYERS) return;
    if (players.some((p) => p.name === sp.name)) return;
    const used = usedColors(players);
    const colorKey = used.has(sp.colorKey) ? nextAvailableColor(players) : sp.colorKey;
    const updated = [...players, { id: genId(), name: sp.name, colorKey, score: 0 }];
    setPlayers(updated);
    setNewPlayerColor(nextAvailableColor(updated));
  }

  function removePlayer(id) {
    setPlayers(players.filter((p) => p.id !== id));
  }

  function startGame() {
    if (players.length < 2) return;
    const order = players.map((p) => p.id);
    setTurnOrder(order);
    setCurrentTurnIndex(0);
    setCurrentTurnScore(0);
    setCustomScoreInput("");
    setGamePhase("playing");
    setFinalRoundRemaining([]);
    setFinalRoundTriggeredBy(null);
    setTurnLog([]);
    setTurnCounter(0);
    setWinner(null);
    setLastTurnSnapshot(null);

    const merged = [...savedPlayers];
    players.forEach((p) => {
      const existingIdx = merged.findIndex((m) => m.name === p.name);
      if (existingIdx >= 0) merged[existingIdx] = { name: p.name, colorKey: p.colorKey };
      else merged.push({ name: p.name, colorKey: p.colorKey });
    });
    setSavedPlayers(merged);

    setScreen("playing");
  }

  const currentPlayer = turnOrder.length
    ? players.find((p) => p.id === turnOrder[currentTurnIndex])
    : null;

  function addToTurn(amount) {
    if (!amount || amount <= 0) return;
    setCurrentTurnScore((s) => s + amount);
    setPulseKey((k) => k + 1);
  }

  function handleCustomAdd() {
    const val = parseInt(customScoreInput, 10);
    if (!isNaN(val) && val > 0) {
      addToTurn(val);
      setCustomScoreInput("");
    }
  }

  function resetTurn() {
    setCurrentTurnScore(0);
  }

  function advanceTurn() {
    setCurrentTurnScore(0);
    setCustomScoreInput("");
    setCurrentTurnIndex((i) => (i + 1) % turnOrder.length);
  }

  function endGame(finalPlayers, log) {
    const maxScore = Math.max(...finalPlayers.map((p) => p.score));
    const tied = finalPlayers.filter((p) => p.score === maxScore);
    let winnerPlayer = tied[0];

    if (tied.length > 1) {
      let earliestTurn = Infinity;
      tied.forEach((p) => {
        const entry = log.find((e) => e.playerId === p.id && e.newTotal >= maxScore);
        if (entry && entry.turnNumber < earliestTurn) {
          earliestTurn = entry.turnNumber;
          winnerPlayer = p;
        }
      });
    }

    setWinner(winnerPlayer);
    setGamePhase("finished");
    setScreen("finished");
  }

  function handleBank() {
    if (!currentPlayer || currentTurnScore <= 0) return;

    setLastTurnSnapshot({
      players,
      turnOrder,
      currentTurnIndex,
      turnLog,
      turnCounter,
      gamePhase,
      finalRoundRemaining,
      finalRoundTriggeredBy,
      enteredScore: currentTurnScore,
      action: "bank",
      playerName: currentPlayer.name,
    });

    const newTotal = currentPlayer.score + currentTurnScore;
    const updatedPlayers = players.map((p) =>
      p.id === currentPlayer.id ? { ...p, score: newTotal } : p
    );
    setPlayers(updatedPlayers);

    const newCounter = turnCounter + 1;
    const newLog = [...turnLog, { turnNumber: newCounter, playerId: currentPlayer.id, newTotal }];
    setTurnCounter(newCounter);
    setTurnLog(newLog);

    let nextRemaining = finalRoundRemaining;
    let nextPhase = gamePhase;

    if (gamePhase === "playing" && newTotal >= WIN_SCORE) {
      nextPhase = "final-round";
      nextRemaining = turnOrder.filter((id) => id !== currentPlayer.id);
      setFinalRoundTriggeredBy(currentPlayer.id);
      setGamePhase(nextPhase);
      setFinalRoundRemaining(nextRemaining);
    } else if (gamePhase === "final-round") {
      nextRemaining = finalRoundRemaining.filter((id) => id !== currentPlayer.id);
      setFinalRoundRemaining(nextRemaining);
    }

    if (nextPhase === "final-round" && nextRemaining.length === 0) {
      endGame(updatedPlayers, newLog);
      return;
    }
    advanceTurn();
  }

  function handleFarkle() {
    if (!currentPlayer) return;

    setLastTurnSnapshot({
      players,
      turnOrder,
      currentTurnIndex,
      turnLog,
      turnCounter,
      gamePhase,
      finalRoundRemaining,
      finalRoundTriggeredBy,
      enteredScore: currentTurnScore,
      action: "farkle",
      playerName: currentPlayer.name,
    });

    const newCounter = turnCounter + 1;
    setTurnCounter(newCounter);

    let nextRemaining = finalRoundRemaining;
    if (gamePhase === "final-round") {
      nextRemaining = finalRoundRemaining.filter((id) => id !== currentPlayer.id);
      setFinalRoundRemaining(nextRemaining);
    }

    if (gamePhase === "final-round" && nextRemaining.length === 0) {
      endGame(players, turnLog);
      return;
    }
    advanceTurn();
  }

  function undoLastTurn() {
    if (!lastTurnSnapshot) return;
    setPlayers(lastTurnSnapshot.players);
    setTurnOrder(lastTurnSnapshot.turnOrder);
    setCurrentTurnIndex(lastTurnSnapshot.currentTurnIndex);
    setTurnLog(lastTurnSnapshot.turnLog);
    setTurnCounter(lastTurnSnapshot.turnCounter);
    setGamePhase(lastTurnSnapshot.gamePhase);
    setFinalRoundRemaining(lastTurnSnapshot.finalRoundRemaining);
    setFinalRoundTriggeredBy(lastTurnSnapshot.finalRoundTriggeredBy);
    setCurrentTurnScore(lastTurnSnapshot.enteredScore);
    setCustomScoreInput("");
    setWinner(null);
    setScreen("playing");
    setLastTurnSnapshot(null);
  }

  function resetToSetup() {
    setPlayers([]);
    setScreen("setup");
    setShowResetConfirm(false);
    setNewPlayerColor(PLAYER_COLORS[0].key);
    setLastTurnSnapshot(null);
  }

  function playAgainSamePlayers() {
    const resetPlayers = players.map((p) => ({ ...p, score: 0 }));
    setPlayers(resetPlayers);
    const order = resetPlayers.map((p) => p.id);
    setTurnOrder(order);
    setCurrentTurnIndex(0);
    setCurrentTurnScore(0);
    setGamePhase("playing");
    setFinalRoundRemaining([]);
    setFinalRoundTriggeredBy(null);
    setTurnLog([]);
    setTurnCounter(0);
    setWinner(null);
    setLastTurnSnapshot(null);
    setScreen("playing");
  }

  const sortedStandings = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`min-h-screen ${T.pageBg} ${T.pageText} transition-colors`}>
      <style>{`
        @keyframes scorePulse {
          0% { transform: scale(1); }
          35% { transform: scale(1.07); }
          100% { transform: scale(1); }
        }
        .score-pulse { animation: scorePulse 260ms ease-out; }
      `}</style>
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Farkle</h1>
            <p className={`text-sm ${T.muted}`}>Scorekeeper</p>
          </div>
          <div className="flex items-center gap-2">
            {screen === "playing" && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className={`p-2 rounded-full ${T.muted} ${T.iconHover} focus:outline-none focus:ring-2 focus:ring-neutral-400`}
                aria-label="Reset game"
                title="End game and return to setup"
              >
                <RotateCcw size={20} />
              </button>
            )}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`p-2 rounded-full ${T.muted} ${T.iconHover} focus:outline-none focus:ring-2 focus:ring-neutral-400`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowRules(true)}
          className={`flex items-center gap-1 text-sm ${T.muted} hover:underline mb-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 rounded`}
        >
          <HelpCircle size={14} />
          Need a reminder on the rules?
        </button>

        {showResetConfirm && (
          <div className={`mb-6 p-4 rounded-xl border ${T.cardBorder} ${T.card} shadow-sm`}>
            <p className="text-sm mb-3">
              End the current game and return to setup? Scores for this game will be lost.
            </p>
            <div className="flex gap-2">
              <button
                onClick={resetToSetup}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
              >
                End game
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`px-3 py-1.5 rounded-lg border ${T.inputBorder} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {screen === "setup" && (
          <SetupScreen
            T={T}
            isDark={isDark}
            players={players}
            newPlayerName={newPlayerName}
            setNewPlayerName={setNewPlayerName}
            newPlayerColor={newPlayerColor}
            setNewPlayerColor={setNewPlayerColor}
            usedColors={usedColors(players)}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            startGame={startGame}
            savedPlayers={savedPlayers.filter((sp) => !players.some((p) => p.name === sp.name))}
            addSavedPlayer={addSavedPlayer}
            nameInputRef={nameInputRef}
          />
        )}

        {screen === "playing" && currentPlayer && (
          <PlayingScreen
            T={T}
            isDark={isDark}
            currentPlayer={currentPlayer}
            currentTurnScore={currentTurnScore}
            addToTurn={addToTurn}
            customScoreInput={customScoreInput}
            setCustomScoreInput={setCustomScoreInput}
            handleCustomAdd={handleCustomAdd}
            resetTurn={resetTurn}
            handleBank={handleBank}
            handleFarkle={handleFarkle}
            pulseKey={pulseKey}
            players={players}
            turnOrder={turnOrder}
            currentTurnIndex={currentTurnIndex}
            gamePhase={gamePhase}
            finalRoundRemaining={finalRoundRemaining}
            finalRoundTriggeredBy={finalRoundTriggeredBy}
            lastTurnSnapshot={lastTurnSnapshot}
            undoLastTurn={undoLastTurn}
          />
        )}

        {screen === "finished" && winner && (
          <FinishedScreen
            T={T}
            isDark={isDark}
            winner={winner}
            standings={sortedStandings}
            playAgainSamePlayers={playAgainSamePlayers}
            resetToSetup={resetToSetup}
            lastTurnSnapshot={lastTurnSnapshot}
            undoLastTurn={undoLastTurn}
          />
        )}

        {showRules && <RulesModal T={T} onClose={() => setShowRules(false)} />}
      </div>
    </div>
  );
}

function PlayerColorSwatch({ colorKey, selected, disabled, onClick, isDark }) {
  const c = getColor(colorKey, isDark);
  const ringClasses = selected
    ? isDark
      ? "ring-2 ring-offset-2 ring-neutral-100 ring-offset-neutral-900"
      : "ring-2 ring-offset-2 ring-neutral-900 ring-offset-white"
    : "";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-9 h-9 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400",
        c.swatch,
        ringClasses,
        disabled ? "opacity-25 cursor-not-allowed" : "hover:scale-110",
      ].join(" ")}
      aria-label={colorKey}
    >
      {selected && <Check size={16} className="mx-auto text-white" />}
    </button>
  );
}

function SetupScreen({
  T,
  isDark,
  players,
  newPlayerName,
  setNewPlayerName,
  newPlayerColor,
  setNewPlayerColor,
  usedColors,
  addPlayer,
  removePlayer,
  startGame,
  savedPlayers,
  addSavedPlayer,
  nameInputRef,
}) {
  const selectedColorClasses = getColor(newPlayerColor, isDark);

  return (
    <div className="space-y-6">
      <div className={`p-4 md:p-5 rounded-2xl border ${T.cardBorder} ${T.card} shadow-sm`}>
        <h2 className="font-semibold mb-3">Add a player</h2>
        <div
          className={["flex items-center gap-2 mb-3 rounded-lg border-2 transition-colors", selectedColorClasses.border].join(" ")}
        >
          <input
            ref={nameInputRef}
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlayer()}
            placeholder="Player name"
            className="flex-1 px-3 py-2 rounded-lg bg-transparent outline-none text-base"
            maxLength={20}
          />
          <button
            onClick={addPlayer}
            disabled={!newPlayerName.trim() || players.length >= MAX_PLAYERS}
            className={[
              "mr-1 p-2 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2",
              selectedColorClasses.solid,
              selectedColorClasses.hoverSolid,
              selectedColorClasses.ring,
            ].join(" ")}
            aria-label="Add player"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PLAYER_COLORS.map((c) => (
            <PlayerColorSwatch
              key={c.key}
              colorKey={c.key}
              isDark={isDark}
              selected={newPlayerColor === c.key}
              disabled={usedColors.has(c.key)}
              onClick={() => setNewPlayerColor(c.key)}
            />
          ))}
        </div>
        {players.length >= MAX_PLAYERS && (
          <p className={`text-xs ${T.muted} mt-2`}>Maximum of {MAX_PLAYERS} players.</p>
        )}
      </div>

      {savedPlayers.length > 0 && (
        <div>
          <h3 className={`text-sm font-medium ${T.muted} mb-2`}>Quick add</h3>
          <div className="flex gap-2 flex-wrap">
            {savedPlayers.map((sp) => {
              const c = getColor(sp.colorKey, isDark);
              return (
                <button
                  key={sp.name}
                  onClick={() => addSavedPlayer(sp)}
                  disabled={players.length >= MAX_PLAYERS}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${T.cardBorder} ${T.card} ${T.hoverNeutral} disabled:opacity-40 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
                >
                  <span className={["w-2.5 h-2.5 rounded-full", c.swatch].join(" ")} />
                  {sp.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className={`text-sm font-medium ${T.muted} mb-2`}>
          Players ({players.length}/{MAX_PLAYERS})
        </h3>
        {players.length === 0 ? (
          <p className={`text-sm ${T.faint} py-6 text-center border border-dashed ${T.dashedBorder} rounded-xl`}>
            🎲 Add 2–6 players to start a game.
          </p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => {
              const c = getColor(p.colorKey, isDark);
              return (
                <li
                  key={p.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${T.cardBorder} ${T.card}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={["w-3 h-3 rounded-full", c.swatch].join(" ")} />
                    <span className="font-medium">{p.name}</span>
                  </span>
                  <button
                    onClick={() => removePlayer(p.id)}
                    className="text-neutral-400 hover:text-red-600 p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 rounded"
                    aria-label={`Remove ${p.name}`}
                  >
                    <X size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        onClick={startGame}
        disabled={players.length < 2}
        className={`w-full py-3 rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors ${T.primaryBtn}`}
      >
        {players.length < 2 ? "Add at least 2 players" : "Start game"}
      </button>
    </div>
  );
}

function PlayingScreen({
  T,
  isDark,
  currentPlayer,
  currentTurnScore,
  addToTurn,
  customScoreInput,
  setCustomScoreInput,
  handleCustomAdd,
  resetTurn,
  handleBank,
  handleFarkle,
  pulseKey,
  players,
  turnOrder,
  currentTurnIndex,
  gamePhase,
  finalRoundRemaining,
  finalRoundTriggeredBy,
  lastTurnSnapshot,
  undoLastTurn,
}) {
  const c = getColor(currentPlayer.colorKey, isDark);
  const riskPct = Math.min(100, (currentTurnScore / 3000) * 100);
  const triggerPlayer = players.find((p) => p.id === finalRoundTriggeredBy);

  return (
    <div className="space-y-6">
      {gamePhase === "final-round" && triggerPlayer && (
        <div className={`p-3 rounded-xl ${T.bannerBg} border ${T.bannerBorder} text-sm`}>
          🏁 <span className="font-semibold">Final round.</span> {triggerPlayer.name} reached{" "}
          {triggerPlayer.score.toLocaleString()}. {finalRoundRemaining.length} player
          {finalRoundRemaining.length !== 1 ? "s" : ""} left for their last turn.
        </div>
      )}

      <div className={["p-6 md:p-8 rounded-2xl border-2 shadow-sm text-center", c.border, c.soft].join(" ")}>
        <p className={["text-sm font-medium uppercase tracking-wide mb-1", c.text].join(" ")}>
          {currentPlayer.name}'s turn
        </p>
        <div
          key={pulseKey}
          className={["score-pulse font-bold text-6xl md:text-7xl tabular-nums", c.text].join(" ")}
        >
          {currentTurnScore.toLocaleString()}
        </div>

        <div className={`h-1.5 rounded-full ${isDark ? "bg-neutral-800" : "bg-neutral-200"} mt-4 mb-1 overflow-hidden`}>
          <div className={["h-full rounded-full transition-all", c.solid].join(" ")} style={{ width: `${riskPct}%` }} />
        </div>
        <p className={`text-xs ${T.muted} mb-5`}>Bank it, or push your luck?</p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_SCORES.map((v) => (
            <button
              key={v}
              onClick={() => addToTurn(v)}
              className={`py-2 rounded-lg border ${T.inputBorder} ${T.card} ${T.hoverNeutral} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
            >
              +{v}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-5">
          <input
            type="number"
            inputMode="numeric"
            value={customScoreInput}
            onChange={(e) => setCustomScoreInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
            placeholder="Custom amount"
            className={`flex-1 px-3 py-2 rounded-lg border ${T.inputBorder} ${T.card} outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 text-sm`}
          />
          <button
            onClick={handleCustomAdd}
            className={`px-4 py-2 rounded-lg border ${T.inputBorder} ${T.card} ${T.hoverNeutral} text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
          >
            Add
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetTurn}
            disabled={currentTurnScore === 0}
            className={`flex-shrink-0 p-3 rounded-xl border ${T.inputBorder} ${T.muted} disabled:opacity-30 ${T.hoverNeutral} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
            aria-label="Reset turn score"
            title="Reset turn score"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={handleFarkle}
            className={`flex-1 py-3 rounded-xl border-2 ${T.inputBorder} font-semibold ${T.hoverNeutral} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
          >
            Farkle
          </button>
          <button
            onClick={handleBank}
            disabled={currentTurnScore === 0}
            className={[
              "flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2",
              c.solid,
              c.hoverSolid,
              c.ring,
            ].join(" ")}
          >
            Bank score
          </button>
        </div>
      </div>

      {lastTurnSnapshot && (
        <div
          className={`p-3 rounded-xl border ${T.cardBorder} ${T.card} flex items-center justify-between gap-3 text-sm`}
        >
          <span>
            {lastTurnSnapshot.action === "bank"
              ? `${lastTurnSnapshot.playerName} banked ${lastTurnSnapshot.enteredScore.toLocaleString()} last turn.`
              : `${lastTurnSnapshot.playerName} farkled last turn, losing ${lastTurnSnapshot.enteredScore.toLocaleString()}.`}
          </span>
          <button
            onClick={undoLastTurn}
            className="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 rounded flex-shrink-0"
          >
            Edit
          </button>
        </div>
      )}

      <div>
        <h3 className={`text-sm font-medium ${T.muted} mb-2`}>Scoreboard</h3>
        <ul className="space-y-2">
          {turnOrder.map((id, idx) => {
            const p = players.find((pl) => pl.id === id);
            if (!p) return null;
            const pc = getColor(p.colorKey, isDark);
            const isCurrent = idx === currentTurnIndex;
            const owesFinalTurn = finalRoundRemaining.includes(id);
            return (
              <li
                key={id}
                className={[
                  "flex items-center justify-between px-4 py-3 rounded-xl border transition-colors",
                  T.card,
                  isCurrent ? [pc.border, "border-2"].join(" ") : T.cardBorder,
                ].join(" ")}
              >
                <span className="flex items-center gap-3">
                  <span className={["w-3 h-3 rounded-full", pc.swatch].join(" ")} />
                  <span className="font-medium">{p.name}</span>
                  {owesFinalTurn && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${T.badgeBg} ${T.badgeText}`}>
                      final turn pending
                    </span>
                  )}
                </span>
                <span className="font-semibold tabular-nums">{p.score.toLocaleString()}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function RulesModal({ T, onClose }) {
  const scoringRows = [
    ["Single 1", "100"],
    ["Single 5", "50"],
    ["Three 1s", "1,000"],
    ["Three 2s", "200"],
    ["Three 3s", "300"],
    ["Three 4s", "400"],
    ["Three 5s", "500"],
    ["Three 6s", "600"],
    ["Four of a kind", "1,000"],
    ["Five of a kind", "2,000"],
    ["Six of a kind", "3,000"],
    ["Straight (1–6)", "1,500"],
    ["Three pairs", "1,500"],
    ["Four of a kind + a pair", "1,500"],
    ["Two triplets", "2,500"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border ${T.cardBorder} ${T.card} p-5 md:p-6 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Farkle rules</h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full ${T.muted} ${T.iconHover} focus:outline-none focus:ring-2 focus:ring-neutral-400`}
            aria-label="Close rules"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-1">Setup</h3>
            <p>6 six-sided dice.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Goal</h3>
            <p>First to 10,000+ points wins.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Each turn</h3>
            <p>
              You must score on every roll, setting aside at least one scoring die before
              re-rolling the rest.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Farkle</h3>
            <p>If a roll has no scoring dice, your turn ends and you lose all points from that turn.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Hot dice</h3>
            <p>
              If all 6 dice end up scoring, you can re-roll all 6 and keep building your turn
              score — or choose to stop.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">No combining</h3>
            <p>Dice from separate rolls can't be combined into a bigger combo.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Banking</h3>
            <p>You can stop at any time to lock in your turn's score.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Winning</h3>
            <p>
              Once a player reaches 10,000+, everyone else gets exactly one more turn to try to
              beat it. Highest score after that wins.
            </p>
          </div>

          <div className={`pt-3 border-t ${T.cardBorder}`}>
            <h3 className="font-semibold mb-2">Scoring</h3>
            <ul className="space-y-1">
              {scoringRows.map(([label, value]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className={T.muted}>{label}</span>
                  <span className="font-medium tabular-nums">{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinishedScreen({
  T,
  isDark,
  winner,
  standings,
  playAgainSamePlayers,
  resetToSetup,
  lastTurnSnapshot,
  undoLastTurn,
}) {
  const c = getColor(winner.colorKey, isDark);
  return (
    <div className="space-y-6 text-center">
      <div className={["p-8 rounded-2xl border-2", c.border, c.soft].join(" ")}>
        <Trophy size={40} className={["mx-auto mb-3", c.text].join(" ")} />
        <p className={`text-sm ${T.muted} mb-1`}>Winner</p>
        <p className={["text-3xl font-bold mb-1", c.text].join(" ")}>{winner.name}</p>
        <p className="text-lg font-medium tabular-nums">{winner.score.toLocaleString()} points</p>
      </div>

      {lastTurnSnapshot && (
        <div
          className={`p-3 rounded-xl border ${T.cardBorder} ${T.card} flex items-center justify-between gap-3 text-sm text-left`}
        >
          <span>
            {lastTurnSnapshot.action === "bank"
              ? `${lastTurnSnapshot.playerName} banked ${lastTurnSnapshot.enteredScore.toLocaleString()} last turn.`
              : `${lastTurnSnapshot.playerName} farkled last turn, losing ${lastTurnSnapshot.enteredScore.toLocaleString()}.`}
          </span>
          <button
            onClick={undoLastTurn}
            className="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 rounded flex-shrink-0"
          >
            Edit
          </button>
        </div>
      )}

      <div>
        <h3 className={`text-sm font-medium ${T.muted} mb-2 text-left`}>Final standings</h3>
        <ul className="space-y-2">
          {standings.map((p, idx) => {
            const pc = getColor(p.colorKey, isDark);
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${T.cardBorder} ${T.card}`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-sm text-neutral-400 w-4">{idx + 1}</span>
                  <span className={["w-3 h-3 rounded-full", pc.swatch].join(" ")} />
                  <span className="font-medium">{p.name}</span>
                </span>
                <span className="font-semibold tabular-nums">{p.score.toLocaleString()}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          onClick={playAgainSamePlayers}
          className={`flex-1 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 ${T.primaryBtn}`}
        >
          Play again
        </button>
        <button
          onClick={resetToSetup}
          className={`flex-1 py-3 rounded-xl border-2 ${T.inputBorder} font-semibold ${T.hoverNeutral} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400`}
        >
          New players
        </button>
      </div>
    </div>
  );
}
