"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { Card } from "@/model/Card";
import { Player } from "@/model/Player";

/**
 * GameComponent.tsx — versão atualizada
 * - Não usa mais mocks
 * - Puxa mão do player via GET /api/game
 * - Remove botão Start Round (round inicia pelo servidor)
 * - Ao confirmar jogada: chama place_guess (com cardId) — NÃO confirma round
 * - Mostra hoveredYear / placedYear no header; mostra round/score/player atual
 * - Mostra notificação temporária "perdeu a vez" quando detecta jogadores sem palpite ao finalizar round
 *
 * Nota: se futuramente você quiser que cada navegador represente um player diferente,
 * passe ?playerId=<id> na URL (ou implemente autenticação/cookie).
 */

export default function GameComponent() {
  // frontend state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [timeline, setTimeline] = useState<{ card: Card; playerId: string; guessedYear: number }[]>([]);
  const [hand, setHand] = useState<Array<{ id: string; title: string; imageUrl?: string }>>([]);
  const [round, setRound] = useState(1);

  const [zoom, setZoom] = useState(1);
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [placedCard, setPlacedCard] = useState<{ card: Card; year: number } | null>(null);
  const [rearrangingCardId, setRearrangingCardId] = useState<string | null>(null);

  // server-driven
  const [roundRemainingSeconds, setRoundRemainingSeconds] = useState<number | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(0);
  const [currentPlayerIdFromServer, setCurrentPlayerIdFromServer] = useState<string | null>(null);

  // notification for missed turns
  const [missedTurnMsg, setMissedTurnMsg] = useState<string | null>(null);
  const missedTurnTimerRef = useRef<number | null>(null);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const PADDING_PERCENT = 2;
  const pollRef = useRef<number | null>(null);

  // Optional: identify local player via query param ?playerId=...
  const getLocalPlayerIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("playerId");
    } catch {
      return null;
    }
  };

  // --- init: start polling (no mocks)
  useEffect(() => {
    fetchState(); // initial
    pollRef.current = window.setInterval(fetchState, 1000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- fetch server state
  // keep last data to detect transitions (round ended etc)
  const lastStateRef = useRef<any>(null);

  async function fetchState() {
    try {
      const res = await fetch("/api/game");
      if (!res.ok) return;
      const data = await res.json();

      // keep raw for transition detection
      const last = lastStateRef.current;

      // players
      const serverPlayers = Array.isArray(data.players) ? data.players : [];
      setPlayers(serverPlayers);

      // timeline
      // API returns timeline as array of placements
      setTimeline(Array.isArray(data.timeline) ? data.timeline : []);

      // total rounds / currentRoundIndex
      setCurrentRoundIndex(typeof data.currentRoundIndex === "number" ? data.currentRoundIndex : 0);
      setTotalRounds(typeof data.totalRounds === "number" ? data.totalRounds : (data.rounds?.length ?? 0));
      setRound(typeof data.currentRoundIndex === "number" ? data.currentRoundIndex + 1 : 1);

      // round timer
      const remaining = typeof data.roundRemainingSeconds === "number" ? data.roundRemainingSeconds : (data.roundRemaining ?? null);
      setRoundRemainingSeconds(remaining);

      // current player id (server indicates who's turn it is)
      const serverCurrentPlayerId = data.currentPlayerId ?? data.currentPlayer?.id ?? null;
      setCurrentPlayerIdFromServer(serverCurrentPlayerId);

      // decide currentPlayer object to show in header:
      // prefer server-provided "currentPlayer" object, else find by currentPlayerId
      if (data.currentPlayer && typeof data.currentPlayer === "object") {
        setCurrentPlayer(data.currentPlayer);
      } else if (serverCurrentPlayerId) {
        const p = serverPlayers.find((x: any) => x.id === serverCurrentPlayerId) ?? null;
        setCurrentPlayer(p);
      } else {
        setCurrentPlayer(serverPlayers.length > 0 ? serverPlayers[0] : null);
      }

      // Update hand: decide which player's hand to display in this browser.
      // Strategy:
      // 1) If URL contains ?playerId=..., show that player's hand.
      // 2) Else if server returned currentPlayer object with hand, show that.
      // 3) Else show first player's hand.
      const urlPlayerId = getLocalPlayerIdFromUrl();
      let localPlayer = null;
      if (urlPlayerId) {
        localPlayer = serverPlayers.find((p: any) => p.id === urlPlayerId) ?? null;
      } else if (data.currentPlayer && data.currentPlayer.hand) {
        localPlayer = data.currentPlayer;
      } else if (serverPlayers.length > 0) {
        localPlayer = serverPlayers[0];
      }
      if (localPlayer && Array.isArray(localPlayer.hand)) {
        setHand(localPlayer.hand);
      } else {
        setHand([]); // empty until server provides
      }

      // Detect round transitions to show "perdeu a vez" notifications:
      // If previously roundActive === true and now roundActive === false,
      // and there were players without guesses -> show their names.
      try {
        const prevActive = last?.roundActive ?? false;
        const nowActive = !!data.roundActive;
        if (prevActive && !nowActive) {
          // round ended; find players missing in currentGuesses list
          const guesses = Array.isArray(data.currentGuesses) ? data.currentGuesses : [];
          const guessedPlayerIds = guesses.map((g: any) => g.playerId);
          const missed = serverPlayers.filter((p: any) => !guessedPlayerIds.includes(p.id));
          if (missed.length > 0) {
            const names = missed.map((m: any) => m.name).join(", ");
            showMissedTurn(`${names} perdeu${missed.length > 1 ? "ram" : "u"} a vez`);
          }
        }
      } catch (e) {
        // ignore detection errors
      }

      lastStateRef.current = data;
    } catch (err) {
      // silent
      // console.error("fetchState error", err);
    }
  }

  function showMissedTurn(msg: string) {
    setMissedTurnMsg(msg);
    if (missedTurnTimerRef.current) window.clearTimeout(missedTurnTimerRef.current);
    missedTurnTimerRef.current = window.setTimeout(() => {
      setMissedTurnMsg(null);
      missedTurnTimerRef.current = null;
    }, 3000);
  }

  // -------------------
  // timeline interactions
  // -------------------
  function getYearFromPosition(x: number) {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const startYear = Number(timelineRef.current.dataset.startYear || 1);
    const visibleYears = Number(timelineRef.current.dataset.visibleYears || 2025);
    const usableWidth = rect.width * (1 - PADDING_PERCENT * 2 / 100);
    const offsetX = x - rect.left - (PADDING_PERCENT / 100) * rect.width;
    const pos = Math.max(0, Math.min(1, offsetX / usableWidth));
    const year = Math.round(startYear + pos * visibleYears);
    return Math.min(Math.max(year, 1), 2025);
  }

  function handleDragStart(cardObj: any, fromTimeline = false) {
    // cardObj might come from server as minimal shape; wrap to Card if necessary
    const card = cardObj instanceof Card ? cardObj : new Card(cardObj.id, cardObj.title, cardObj.imageUrl ?? "", cardObj.year ?? 0);
    setDraggingCard(card);
    if (fromTimeline) {
      setRearrangingCardId(card.id);
      setTimeline((prev) => prev.filter((p) => p.card.id !== card.id));
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (draggingCard) {
      const y = getYearFromPosition(e.clientX);
      setHoveredYear(y);
    }
  }

  function handleMouseUp() {
    if (draggingCard && hoveredYear) {
      setPlacedCard({ card: draggingCard, year: hoveredYear });
      setDraggingCard(null);
      setRearrangingCardId(null);
    }
  }

  // -------------------
  // server actions
  // -------------------

  // place guess only (do NOT call confirm_round here) — server will advance turn
  async function apiPlaceGuess(playerId: string, cardId: string, guessedYear: number) {
    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "place_guess", playerId, cardId, guessedYear }),
      });
      // reflect server state after placing
      await fetchState();
      return res;
    } catch (err) {
      console.error("apiPlaceGuess error", err);
      return null;
    }
  }

  // UI handler after player confirms placed card
  async function confirmPlay() {
    if (!placedCard || !currentPlayer) return;
    // find card id in our hand (hand items from server are minimal)
    const cardId = placedCard.card.id;
    // call API place_guess
    await apiPlaceGuess(currentPlayer.id, cardId, placedCard.year);

    // optimistic UI update: remove card from local hand and add to timeline preview while server updates
    setHand((prev) => prev.filter((c: any) => c.id !== cardId));
    setTimeline((prev) => [
      ...prev,
      { card: placedCard.card, playerId: currentPlayer.id, guessedYear: placedCard.year },
    ]);
    setPlacedCard(null);
    setHoveredYear(null);
  }

  // -------------------
  // markers (keep simple)
  // -------------------
  function getVisibleMarkers() {
    if (!timelineRef.current) return [];
    const startYear = Number(timelineRef.current.dataset.startYear || 1);
    const visibleYears = Number(timelineRef.current.dataset.visibleYears || 2025);
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = timelineRect.width;
    const markers: JSX.Element[] = [];

    const interval = 100;
    const first = Math.ceil(startYear / interval) * interval;
    const last = Math.floor((startYear + visibleYears - 1) / interval) * interval;
    for (let y = first; y <= last; y += interval) {
      if (y < 1 || y > 2025) continue;
      const posPercent = ((y - startYear) / visibleYears);
      const leftPosition = PADDING_PERCENT + posPercent * (100 - PADDING_PERCENT * 2);
      markers.push(
        <div key={`marker-${y}`} className="absolute top-1/2 -translate-y-1/2 transition-all duration-300" style={{ left: `${leftPosition}%` }}>
          <div className="h-8 w-px bg-gray-400 mx-auto" />
          <span className="absolute -bottom-8 font-bold text-gray-700 text-sm -translate-x-1/2">{y}</span>
        </div>
      );
    }
    return markers;
  }

  // -------------------
  // Render
  // -------------------
  return (
    <div className="flex flex-col h-screen bg-[#f9f9fb] overflow-hidden select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <header className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-white shadow-sm relative">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">
          <span className="hidden sm:inline">Timeline Game</span>
          <span className="sm:hidden material-symbols-outlined !text-2xl">history_edu</span>
        </h1>

        <div className="flex gap-2 md:gap-4 text-xs md:text-sm font-semibold items-center">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">hourglass_empty</span>
            <span className="hidden sm:inline">Round:</span>
            <span className="text-purple-600">{round}/{totalRounds || 10}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">person</span>
            <span className="hidden sm:inline">Player:</span>
            <span className="text-purple-600">{currentPlayer?.name ?? "Carregando..."}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">emoji_events</span>
            <span className="hidden sm:inline">Score:</span>
            <span className="text-purple-600">{currentPlayer?.score ?? 0}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">calendar_month</span>
            <span className="hidden sm:inline">Ano:</span>
            <span className="text-purple-600">
              {hoveredYear ?? placedCard?.year ?? "-"}
            </span>
          </div>
        </div>

        {/* no Start Round button — round is server driven */}

        {/* centered badge showing hoveredYear or timer */}
        <div className="absolute left-1/2 top-4 -translate-x-1/2 pointer-events-none">
          {hoveredYear ? (
            <div className="bg-purple-600 text-white font-bold px-3 py-1 rounded-lg shadow-md text-sm">{hoveredYear}</div>
          ) : roundRemainingSeconds != null ? (
            <div className="bg-purple-600 text-white font-bold px-3 py-1 rounded-lg shadow-md text-sm">
              {roundRemainingSeconds}s
            </div>
          ) : null}
        </div>

        {/* missed turn toast */}
        {missedTurnMsg && (
          <div className="absolute right-4 top-4 bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm shadow">
            {missedTurnMsg}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div ref={timelineRef} className="relative w-full h-[60%] overflow-hidden bg-gray-100" data-start-year="1" data-visible-years="2025">
          <div className="absolute top-1/2 left-[2%] w-[96%] h-1 bg-gray-400 -translate-y-1/2" />
          <div className="absolute top-0 left-0 w-full h-full">{getVisibleMarkers()}</div>

          {/* timeline placements */}
          {timeline.map((placement) => {
            const startYear = Number(timelineRef.current?.dataset.startYear || 1);
            const visibleYears = Number(timelineRef.current?.dataset.visibleYears || 2025);
            const posPercent = ((placement.guessedYear - startYear) / visibleYears) * 96;
            return (
              <div
                key={`${placement.card.id}-${placement.playerId}-${placement.guessedYear}`}
                className="absolute transition-all duration-300 cursor-pointer"
                style={{ left: `${2 + posPercent}%`, top: "40%", transform: "translate(-50%, -50%)" }}
                onMouseDown={() => handleDragStart(placement.card as any, true)}
              >
                <div className="w-40 bg-white rounded-xl shadow-lg p-2 text-center">
                  <img src={(placement.card as any).imageUrl} alt={(placement.card as any).title} className="w-full h-20 object-cover rounded-md mb-2" />
                  <p className="text-sm font-semibold">{(placement.card as any).title}</p>
                  <p className="text-xs text-gray-500">({placement.guessedYear})</p>
                </div>
              </div>
            );
          })}

          {/* placedCard preview while dragging */}
          {placedCard && (
            <div
              className="absolute transition-all"
              style={{
                left: `${2 + ((placedCard.year - Number(timelineRef.current?.dataset.startYear || 1)) / Number(timelineRef.current?.dataset.visibleYears || 2025)) * 96}%`,
                top: "35%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="w-40 bg-purple-100 border-2 border-purple-500 rounded-xl shadow-lg p-2 text-center">
                <img src={placedCard.card.imageUrl} alt={placedCard.card.title} className="w-full h-20 object-cover rounded-md mb-2" />
                <p className="text-sm font-semibold text-purple-700">{placedCard.card.title}</p>
              </div>
            </div>
          )}

          {hoveredYear && draggingCard && (
            <div
              className="absolute top-1/2 w-px bg-purple-600"
              style={{
                left: `${2 + ((hoveredYear - Number(timelineRef.current?.dataset.startYear || 1)) / Number(timelineRef.current?.dataset.visibleYears || 2025)) * 96}%`,
                height: "100%",
                transform: "translateX(-50%)",
              }}
            />
          )}
        </div>

        <div className="w-full h-[40%] bg-gray-50 border-t border-gray-200 p-6 flex flex-col items-center justify-center">
          <h2 className="font-bold text-lg mb-4">Suas Cartas</h2>
          <div className="flex gap-6 flex-wrap justify-center">
            {hand.map((card: any) => (
              <div
                key={card.id}
                onMouseDown={() => handleDragStart(card)}
                className="w-40 p-3 rounded-xl bg-white shadow-md cursor-pointer hover:scale-105 hover:shadow-purple-300 transition-transform"
              >
                <img src={card.imageUrl} alt={card.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                <h3 className="font-bold text-center">{card.title}</h3>
              </div>
            ))}
            {hand.length === 0 && <div className="text-sm text-gray-500">Aguardando cartas da API...</div>}
          </div>

          {placedCard && (
            <button onClick={confirmPlay} className="mt-6 px-8 py-3 bg-purple-600 text-white font-bold rounded-lg text-lg hover:bg-purple-700 transition-transform hover:scale-105 shadow-lg">
              Confirmar Jogada
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
