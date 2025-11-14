"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card } from "@/model/Card";
import { Player } from "@/model/Player";

export default function GameComponent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [timeline, setTimeline] = useState<{ card: Card; player: Player; guessedYear: number }[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [round, setRound] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [placedCard, setPlacedCard] = useState<{ card: Card; year: number } | null>(null);
  const [rearrangingCardId, setRearrangingCardId] = useState<string | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const PADDING_PERCENT = 2;

  useEffect(() => {
    async function loadGame() {
      const res = await fetch("/api/game");
      const data = await res.json();
      setPlayers(data.players);
      setTimeline(data.timeline.placements);
      setCurrentPlayer(data.currentPlayer);
      setHand([
        new Card("1", "Revolução Francesa", "https://placekitten.com/200/120", 1789),
        new Card("2", "Queda do Muro de Berlim", "https://placekitten.com/200/121", 1989),
        new Card("3", "Descoberta da América", "https://placekitten.com/200/122", 1492),
      ]);
    }
    loadGame();
  }, []);

  // 🔹 Zoom centrado no ponto do mouse, com limites rígidos
  // ... (código anterior)

  // 🔹 Zoom centrado no ponto do mouse, com limites rígidos
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const timelineWidth = rect.width;
    const PADDING_PX = timelineWidth * (PADDING_PERCENT / 100);
    const usableWidth = timelineWidth - (2 * PADDING_PX);

    // e.clientX é a posição do mouse na tela. Queremos a posição relativa ao usableWidth.
    const mouseXRelativeToTimeline = e.clientX - rect.left - PADDING_PX; // Posição do mouse dentro da área "usável" da timeline

    setZoom((prevZoom) => {
      let nextZoom = prevZoom - e.deltaY * 0.001;
      nextZoom = Math.min(Math.max(nextZoom, 1), 5.0); // Ajustei minZoom para 1, maxZoom para 5 (pode ser ajustado)

      const totalGameYears = 2025 - 1 + 1; // 2025 anos
      let currentVisibleYears = totalGameYears / prevZoom;
      let nextVisibleYears = totalGameYears / nextZoom;

      let currentStartYear = Number(timelineRef.current!.dataset.startYear || 1);
      let currentEndYear = currentStartYear + currentVisibleYears - 1;

      // Calcular o ano que estava sob o mouse antes do zoom
      const mouseYearBeforeZoom = currentStartYear + (mouseXRelativeToTimeline / usableWidth) * currentVisibleYears;

      let newStartYear = mouseYearBeforeZoom - (mouseXRelativeToTimeline / usableWidth) * nextVisibleYears;
      let newEndYear = newStartYear + nextVisibleYears - 1;

      // --- Aplica os limites para newStartYear e newEndYear ---
      // Caso 1: A timeline tenta começar antes de 1
      if (newStartYear < 1) {
        newStartYear = 1;
        newEndYear = newStartYear + nextVisibleYears - 1;
      }
      // Caso 2: A timeline tenta terminar depois de 2025
      if (newEndYear > 2025) {
        newEndYear = 2025;
        newStartYear = newEndYear - nextVisibleYears + 1; // Ajusta o startYear para trás
        // Se, após ajustar, newStartYear ainda for menor que 1 (acontece com zoom muito pequeno, onde nextVisibleYears é > 2025)
        if (newStartYear < 1) {
            newStartYear = 1; // Garante que não vai para anos negativos
        }
      }

      // Garante que o número de anos visíveis não exceda o total (2025)
      if (nextVisibleYears > totalGameYears) {
          nextVisibleYears = totalGameYears;
          newStartYear = 1;
          newEndYear = 2025;
      }


      timelineRef.current!.dataset.startYear = Math.round(newStartYear).toString();
      timelineRef.current!.dataset.visibleYears = Math.round(nextVisibleYears).toString(); // Arredonda para evitar frações no dataset

      return nextZoom;
    });
  }

// ... (resto do código)

  function getYearFromPosition(x: number) {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const startYear = Number(timelineRef.current.dataset.startYear || 1);
    const visibleYears = Number(timelineRef.current.dataset.visibleYears || 2025);
    const usableWidth = rect.width * (1 - PADDING_PERCENT * 2 / 100);
    const offsetX = x - rect.left - (PADDING_PERCENT / 100) * rect.width;
    const pos = offsetX / usableWidth;
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

  function confirmPlay() {
    if (!placedCard || !currentPlayer) return;
    setTimeline((prev) => [
      ...prev,
      { card: placedCard.card, player: currentPlayer, guessedYear: placedCard.year },
    ]);
    setHand((prev) => prev.filter((c) => c.id !== placedCard.card.id));
    setPlacedCard(null);
    setHoveredYear(null);
  }

  function getVisibleMarkers() {
    if (!timelineRef.current) return [];
    const startYear = Number(timelineRef.current.dataset.startYear || 1);
    const visibleYears = Number(timelineRef.current.dataset.visibleYears || 2025);
    const markers = [];

    const firstHundred = Math.ceil(startYear / 100) * 100;
    const lastHundred = Math.floor((startYear + visibleYears) / 100) * 100;
    for (let i = firstHundred; i <= lastHundred; i += 100) {
      const posPercent = ((i - startYear) / visibleYears) * 100;
      markers.push(
        <div
          key={`h-${i}`}
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-300"
          style={{ left: `${PADDING_PERCENT + posPercent * (1 - PADDING_PERCENT * 2 / 100)}%` }}
        >
          <div className="h-8 w-px bg-gray-400 mx-auto"></div>
          <span className="absolute -bottom-8 font-bold text-gray-700 text-sm -translate-x-1/2">{i}</span>
        </div>
      );
    }

    if (zoom >= 2) {
      const firstTen = Math.ceil(startYear / 10) * 10;
      const lastTen = Math.floor((startYear + visibleYears) / 10) * 10;
      for (let i = firstTen; i <= lastTen; i += 10) {
        if (i % 100 === 0) continue;
        const posPercent = ((i - startYear) / visibleYears) * 100;
        const opacity = Math.min(1, (zoom - 1.5) / 1.5);
        markers.push(
          <div
            key={`t-${i}`}
            className="absolute top-1/2 -translate-y-1/2 transition-opacity duration-300"
            style={{
              left: `${PADDING_PERCENT + posPercent * (1 - PADDING_PERCENT * 2 / 100)}%`,
              opacity,
            }}
          >
            <div className="h-4 w-px bg-gray-400 mx-auto"></div>
            <span className="absolute -bottom-6 text-gray-500 text-xs -translate-x-1/2">{i}</span>
          </div>
        );
      }
    }

    return markers;
  }

  return (
    <div
      className="flex flex-col h-screen bg-[#f9f9fb] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm relative">
        <h1 className="text-xl font-bold text-gray-900">Timeline Game</h1>
        <div className="flex gap-4 text-sm font-semibold items-center">
          <div>Round: <span className="text-purple-600">{round}/10</span></div>
          <div>Jogador: <span className="text-purple-600">{currentPlayer?.name ?? "Carregando..."}</span></div>
          <div>Score: <span className="text-purple-600">{currentPlayer?.score ?? 0}</span></div>
        </div>
        {hoveredYear && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white font-bold px-4 py-2 rounded-lg shadow-md">
            {hoveredYear}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div
          ref={timelineRef}
          className="relative w-full h-[60%] overflow-hidden bg-gray-100"
          data-start-year="1"
          data-visible-years="2025"
        >
          <div className="absolute top-1/2 left-[2%] w-[96%] h-1 bg-gray-400 -translate-y-1/2"></div>
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
                  <img src={placement.card.imageUrl} alt={placement.card.title} className="w-full h-20 object-cover rounded-md mb-2"/>
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
                transform: "translate(-50%, -50%)"
              }}
            >
              <div className="w-40 bg-purple-100 border-2 border-purple-500 rounded-xl shadow-lg p-2 text-center">
                <img src={placedCard.card.imageUrl} alt={placedCard.card.title} className="w-full h-20 object-cover rounded-md mb-2"/>
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
                transform: "translateX(-50%)"
              }}
            ></div>
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
                <img src={card.imageUrl} alt={card.title} className="w-full h-24 object-cover rounded-lg mb-2"/>
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
