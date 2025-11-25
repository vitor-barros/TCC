"use client";

import React, { useEffect, useRef, useState } from "react";
import { onValue, ref } from "firebase/database";
import { auth, db } from "../lib/firebase"; 
import { Card } from "@/model/Card";
import { Player } from "@/model/Player";

type TimelineItem = { card: Card; playerId: string; guessedYear: number; isTemporary?: boolean };

export default function GameComponent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [roundActive, setRoundActive] = useState(false);
  const [turnEndsAt, setTurnEndsAt] = useState<number | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  
  const [remainingTime, setRemainingTime] = useState(0);
  const [dragCard, setDragCard] = useState<Card | null>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 1. Auth Sync
  useEffect(() => {
     if(auth.currentUser) setMyUid(auth.currentUser.uid);
  }, []);

  // 2. Firebase Listener
  useEffect(() => {
    const roomRef = ref(db, "sala_unica");
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const loadedPlayers = (data.players || []).map((p: any) => ({ ...p, hand: p.hand || [] }));
      setPlayers(loadedPlayers);
      setTimeline(data.timeline || []);
      setRoundActive(data.roundActive);
      setTurnEndsAt(data.turnEndsAt);
      
      // Descobrir ID de quem joga agora
      const idx = data.currentPlayerIndex || 0;
      const currentP = loadedPlayers[idx];
      setCurrentPlayerId(currentP ? currentP.id : null);

      // Minha mão
      if (auth.currentUser) {
          const me = loadedPlayers.find((p: any) => p.id === auth.currentUser?.uid);
          setMyHand(me ? me.hand : []);
      }
    });
    return () => unsub();
  }, []);

  // 3. Timer do Turno
  useEffect(() => {
    if (!turnEndsAt) { setRemainingTime(0); return; }
    const i = setInterval(() => {
        const diff = Math.ceil((turnEndsAt - Date.now()) / 1000);
        setRemainingTime(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(i);
  }, [turnEndsAt]);

  const confirmGuess = async () => {
      if (!dragCard || !hoverYear || !myUid) return;
      if (myUid !== currentPlayerId) { alert("Não é sua vez!"); setDragCard(null); return; }

      // Optimistic remove
      setMyHand(prev => prev.filter(c => c.id !== dragCard.id));
      setDragCard(null); setHoverYear(null);

      await fetch("/api/game", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "place_guess", playerId: myUid, cardId: dragCard.id, guessedYear: hoverYear })
      });
  };

  const getYearFromX = (x: number) => {
      if (!timelineRef.current) return 2025;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      // Escala de 0 a 2025 anos (ajuste se seu jogo tiver AC/DC ou range menor)
      return Math.round(pct * 2025);
  };

  if (!myUid) return <div className="p-10 text-center">Carregando usuário...</div>;

  const isMyTurn = myUid === currentPlayerId;
  const currentPlayerName = players.find(p => p.id === currentPlayerId)?.name || "Ninguém";

  return (
    <div className="flex flex-col h-screen bg-slate-50 select-none" onMouseUp={() => { if(dragCard) confirmGuess(); }}>
        
        {/* HEADER */}
        <header className="bg-white p-4 shadow flex justify-between items-center z-10">
            <div>
               <h1 className="font-bold text-xl text-slate-800">Timeline</h1>
               <div className="text-sm text-slate-500">
                  Vez de: <span className="font-bold text-purple-600">{currentPlayerName}</span>
               </div>
            </div>

            <div className={`text-3xl font-mono font-bold ${remainingTime < 10 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
               {remainingTime}s
            </div>

            <div className="flex gap-4">
                {players.map(p => (
                    <div key={p.id} className={`flex flex-col items-center ${p.id === currentPlayerId ? 'opacity-100 scale-110' : 'opacity-50'}`}>
                        <div className="font-bold">{p.score} pts</div>
                        <div className="text-xs">{p.name}</div>
                    </div>
                ))}
            </div>
        </header>

        {/* TIMELINE */}
        <div 
            ref={timelineRef}
            className="flex-1 relative bg-slate-200 overflow-hidden border-y border-slate-300 shadow-inner"
            onMouseMove={(e) => dragCard && setHoverYear(getYearFromX(e.clientX))}
        >
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-400 -translate-y-1/2"></div>
            
            {/* Marcadores de Ano (Opcional) */}
            <div className="absolute bottom-2 left-2 text-xs text-slate-500">Ano 0</div>
            <div className="absolute bottom-2 right-2 text-xs text-slate-500">Ano 2025</div>

            {/* Cartas na Mesa */}
            {timeline.map((item, idx) => {
                const leftPct = (item.guessedYear / 2025) * 100;
                return (
                    <div 
                        key={idx} 
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500"
                        style={{ left: `${leftPct}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        {/* Linha vertical */}
                        <div className={`w-0.5 h-8 mb-1 ${item.isTemporary ? 'bg-yellow-500' : 'bg-slate-800'}`}></div>
                        
                        <div className={`p-1.5 rounded-lg shadow-lg w-28 text-center bg-white border-2 ${item.isTemporary ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-100'}`}>
                            <div className="text-[10px] font-bold truncate text-slate-800">{item.card.title}</div>
                            <img src={item.card.imageUrl} className="w-full h-16 object-cover rounded my-1 bg-gray-100" />
                            <div className="text-xs font-mono text-purple-700 font-bold">{item.guessedYear}</div>
                        </div>
                        {item.isTemporary && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded mt-1">Aguardando...</span>}
                    </div>
                )
            })}

            {/* Ghost Card (Arrastando) */}
            {dragCard && hoverYear !== null && (
                <div 
                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-80 z-50 flex flex-col items-center"
                    style={{ left: `${(hoverYear / 2025) * 100}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="bg-purple-600 text-white font-bold px-2 py-1 rounded mb-2 text-sm shadow">{hoverYear}</div>
                    <div className="w-28 bg-white p-1 rounded-lg border-2 border-purple-600 shadow-xl">
                       <img src={dragCard.imageUrl} className="w-full h-20 object-cover rounded" />
                    </div>
                </div>
            )}
        </div>

        {/* HAND AREA */}
        <div className={`h-56 bg-white p-4 flex flex-col items-center justify-center transition-colors ${isMyTurn ? 'bg-purple-50' : 'bg-gray-100 grayscale'}`}>
            {!isMyTurn && roundActive && <p className="text-slate-500 font-bold mb-4">Aguarde a vez de {currentPlayerName}...</p>}
            {isMyTurn && roundActive && <p className="text-purple-600 font-bold mb-2 animate-bounce">Sua vez! Arraste uma carta para a linha do tempo.</p>}
            
            <div className="flex gap-4 overflow-x-auto w-full justify-center px-4 py-2">
                {myHand.map(card => (
                    <div 
                        key={card.id}
                        onMouseDown={() => isMyTurn && setDragCard(card)}
                        className={`w-32 flex-shrink-0 bg-white rounded-xl shadow-md p-2 border border-slate-200 transition-transform ${isMyTurn ? 'cursor-grab hover:-translate-y-2 hover:shadow-xl active:cursor-grabbing' : 'cursor-not-allowed opacity-70'}`}
                    >
                        <img src={card.imageUrl} className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-200" />
                        <div className="text-center font-bold text-xs text-slate-700 leading-tight">{card.title}</div>
                    </div>
                ))}
                {myHand.length === 0 && roundActive && <div className="text-sm text-gray-400 italic">Sem cartas na mão.</div>}
            </div>
        </div>
    </div>
  );
}