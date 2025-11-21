"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { Card } from "@/model/Card";
import { Player } from "@/model/Player";

/**
 * GameComponent.tsx — atualizado com:
 * - polling GET /api/game
 * - exibição do timer no header
 * - endpoints: start_round, place_guess, confirm_round
 * - mantém seu estilo de header e a lógica de drag/zoom
 *
 * Substitua o arquivo atual por este.
 */

export default function GameComponent() {
  // --- estado visual / de jogo local
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [timeline, setTimeline] = useState<{ card: Card; player: Player; guessedYear: number }[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [round, setRound] = useState(1);

  // timeline view / drag state (mantive seus nomes)
  const [zoom, setZoom] = useState(1);
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [placedCard, setPlacedCard] = useState<{ card: Card; year: number } | null>(null);
  const [rearrangingCardId, setRearrangingCardId] = useState<string | null>(null);

  // server-driven
  const [roundRemainingSeconds, setRoundRemainingSeconds] = useState<number | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [totalRounds, setTotalRounds] = useState<number>(0);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const PADDING_PERCENT = 2;

  // polling handle
  const pollRef = useRef<number | null>(null);

  // --- inicialização (carrega estado inicial e carta de exemplo)
  useEffect(() => {
    // seed hand local (para testes visuais)
    setHand([
      new Card("1", "Revolução Francesa", "https://placecats.com/millie/300/150", 1789),
      new Card("2", "Queda do Muro de Berlim", "https://placecats.com/neo_2/300/200", 1989),
      new Card("3", "Descoberta da América", "https://placecats.com/millie_neo/300/200", 1492),
    ]);

    // start polling
    fetchState(); // initial
    pollRef.current = window.setInterval(fetchState, 1000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Função que busca estado no servidor
  async function fetchState() {
    try {
      const res = await fetch("/api/game");
      if (!res.ok) return;
      const data = await res.json();

      // proteções caso propriedades estejam ausentes
      setPlayers(data.players ?? []);
      setTimeline(Array.isArray(data.timeline?.placements) ? data.timeline.placements : (data.timeline ?? []));
      // currentPlayer pode ser um objeto player ou apenas id
      if (data.currentPlayer && typeof data.currentPlayer === "object") {
        setCurrentPlayer(data.currentPlayer as Player);
      } else if (Array.isArray(data.players) && data.players.length > 0) {
        // fallback: se não veio currentPlayer, usa primeiro player
        setCurrentPlayer((data.players[0] as Player) ?? null);
      } else {
        setCurrentPlayer(null);
      }

      // Timer / rounds
      const remaining = data.roundRemainingSeconds ?? data.roundRemaining ?? null;
      setRoundRemainingSeconds(typeof remaining === "number" ? remaining : null);
      setCurrentRoundIndex(data.currentRoundIndex ?? 0);
      setTotalRounds(data.totalRounds ?? (data.rounds?.length ?? 0));

      // if server provides round number, set it
      if (typeof data.currentRoundIndex === "number") {
        setRound(data.currentRoundIndex + 1);
      }
    } catch (err) {
      // silencioso — pode logar se quiser
      // console.error("fetchState error", err);
    }
  }

  // -------------------
  // Timeline / drag logic (mantive suas funções, só pequenos guards)
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

  function handleDragStart(card: Card, fromTimeline = false) {
    setDraggingCard(card);
    if (fromTimeline) {
      setRearrangingCardId(card.id);
      setTimeline((prev) => prev.filter((p) => p.card.id !== card.id));
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (draggingCard) {
      const year = getYearFromPosition(e.clientX);
      setHoveredYear(year);
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
  // Server actions: start round, place guess, confirm round
  // -------------------

  async function apiStartRound(duration?: number) {
    try {
      await fetch("/api/game", {
        method: "POST",
        body: JSON.stringify({ action: "start_round", duration }),
        headers: { "Content-Type": "application/json" },
      });
      // fetchState will update by poll
      await fetchState();
    } catch (err) {
      console.error("startRound error", err);
    }
  }

  async function apiPlaceGuessAndConfirm(playerId: string, guessedYear: number) {
    try {
      // place guess
      await fetch("/api/game", {
        method: "POST",
        body: JSON.stringify({ action: "place_guess", playerId, guessedYear }),
        headers: { "Content-Type": "application/json" },
      });
      // then confirm round (server will resolve and scoring happens)
      await fetch("/api/game", {
        method: "POST",
        body: JSON.stringify({ action: "confirm_round" }),
        headers: { "Content-Type": "application/json" },
      });
      // immediate fetch to reflect changes
      await fetchState();
    } catch (err) {
      console.error("placeGuess error", err);
    }
  }

  // chamada usada quando o jogador clica Confirmar Jogada (no UI)
  function confirmPlay() {
    if (!placedCard || !currentPlayer) return;
    // chama api: place_guess + confirm_round
    apiPlaceGuessAndConfirm(currentPlayer.id, placedCard.year);

    // manutenção local: mantém a UX responsiva enquanto server responde
    setTimeline((prev) => [
      ...prev,
      { card: placedCard.card, player: currentPlayer, guessedYear: placedCard.year },
    ]);
    setHand((prev) => prev.filter((c) => c.id !== placedCard.card.id));
    setPlacedCard(null);
    setHoveredYear(null);
  }

  // -------------------
  // Render marcadores (mantive seu getVisibleMarkers simples para compatibilidade)
  // -------------------
  function getVisibleMarkers() {
    if (!timelineRef.current) return [];
    const startYear = Number(timelineRef.current.dataset.startYear || 1);
    const visibleYears = Number(timelineRef.current.dataset.visibleYears || 2025);
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = timelineRect.width;
    const markers: JSX.Element[] = [];

    // Simple fixed hundreds at zoom-out; adaptive on resize not essential here
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


  return (
    <div
      className="flex flex-col h-screen bg-[#f9f9fb] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <header className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-white shadow-sm relative">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">
          <span className="hidden sm:inline">Timeline Game</span>
          <span className="sm:hidden material-symbols-outlined !text-2xl">history_edu</span>
        </h1>

        {/* center info (keeps same visual pattern; on small screens this may collapse) */}
        <div className="flex gap-2 md:gap-4 text-xs md:text-sm font-semibold items-center">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">hourglass_empty</span>
            <span className="hidden sm:inline">Round:</span> <span className="text-purple-600">{round}/10</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">person</span>
            <span className="hidden sm:inline">Player:</span> <span className="text-purple-600">{currentPlayer?.name ?? "Carregando..."}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-xl">emoji_events</span>
            <span className="hidden sm:inline">Score:</span> <span className="text-purple-600">{currentPlayer?.score ?? 0}</span>
          </div>
        </div>

        {/* right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => apiStartRound(30)}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Start Round
          </button>
        </div>

        {/* centered badge showing the current hovered year or timer when available */}
        <div className="absolute left-1/2 top-4 -translate-x-1/2 pointer-events-none">
          {/* priority: hoveredYear (while dragging) -> timer -> empty */}
          {hoveredYear ? (
            <div className="bg-purple-600 text-white font-bold px-3 py-1 rounded-lg shadow-md text-sm">{hoveredYear}</div>
          ) : roundRemainingSeconds != null ? (
            <div className="bg-purple-600 text-white font-bold px-3 py-1 rounded-lg shadow-md text-sm">
              {roundRemainingSeconds}s
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div
          ref={timelineRef}
          className="relative w-full h-[60%] overflow-hidden bg-gray-100"
          data-start-year="1"
          data-visible-years="2025"
        >
          <div className="absolute top-1/2 left-[2%] w-[96%] h-1 bg-gray-400 -translate-y-1/2" />
          <div className="absolute top-0 left-0 w-full h-full">{getVisibleMarkers()}</div>

          {timeline.map((placement) => {
            const startYear = Number(timelineRef.current?.dataset.startYear || 1);
            const visibleYears = Number(timelineRef.current?.dataset.visibleYears || 2025);
            const posPercent = ((placement.guessedYear - startYear) / visibleYears) * 96;
            return (
              <div
                key={placement.card.id}
                className="absolute transition-all duration-300 cursor-pointer"
                style={{ left: `${2 + posPercent}%`, top: "40%", transform: "translate(-50%, -50%)" }}
                onMouseDown={() => handleDragStart(placement.card, true)}
              >
                <div className="w-40 bg-white rounded-xl shadow-lg p-2 text-center">
                  <img src={placement.card.imageUrl} alt={placement.card.title} className="w-full h-20 object-cover rounded-md mb-2" />
                  <p className="text-sm font-semibold">{placement.card.title}</p>
                  <p className="text-xs text-gray-500">({placement.guessedYear})</p>
                </div>
              </div>
            );
          })}

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
            {hand.map((card) => (
              <div
                key={card.id}
                onMouseDown={() => handleDragStart(card)}
                className="w-40 p-3 rounded-xl bg-white shadow-md cursor-pointer hover:scale-105 hover:shadow-purple-300 transition-transform"
              >
                <img src={card.imageUrl} alt={card.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                <h3 className="font-bold text-center">{card.title}</h3>
              </div>
            ))}
          </div>

          {placedCard && (
            <button
              onClick={confirmPlay}
              className="mt-6 px-8 py-3 bg-purple-600 text-white font-bold rounded-lg text-lg hover:bg-purple-700 transition-transform hover:scale-105 shadow-lg"
            >
              Confirmar Jogada
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
