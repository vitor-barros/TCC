"use client";

import React, { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, db } from "../lib/firebase"; 
import { Card } from "@/model/Card";
import { Player } from "@/model/Player";
import { useRouter } from "next/navigation"; 

// --- CONSTANTES ---
const PADDING_X = 40; 

type TimelineItem = { card: Card; playerId: string; guessedYear: number; isTemporary?: boolean };

export default function GameComponent() {
  const router = useRouter();
  
  // --- ESTADOS DO JOGO ---
  const [players, setPlayers] = useState<Player[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [roundActive, setRoundActive] = useState(false);
  const [turnEndsAt, setTurnEndsAt] = useState<number | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- ESTADOS LOCAIS ---
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const [dragCard, setDragCard] = useState<Card | null>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [inputYear, setInputYear] = useState<string>("");

  // 1. Detectar Mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); 
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Auth Sync
  useEffect(() => {
     const unsub = onAuthStateChanged(auth, (user) => {
        if (user) { setMyUid(user.uid); } else { setMyUid(null); }
     });
     return () => unsub();
  }, []);

  // 3. Firebase Listener
  useEffect(() => {
    const roomRef = ref(db, "sala_unica");
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      setIsDataLoaded(true);
      if (!data) return;

      const loadedPlayers = (data.players || []).map((p: any) => ({ ...p, hand: p.hand || [] }));
      setPlayers(loadedPlayers);
      setTimeline(data.timeline || []);
      setRoundActive(data.roundActive);
      setTurnEndsAt(data.turnEndsAt);
      
      const idx = data.currentPlayerIndex || 0;
      const currentP = loadedPlayers[idx];
      setCurrentPlayerId(currentP ? currentP.id : null);

      if (auth.currentUser) {
          const me = loadedPlayers.find((p: any) => p.id === auth.currentUser?.uid);
          setMyHand(me ? me.hand : []);
      }
    });
    return () => unsub();
  }, []);

  // 4. Timer
  useEffect(() => {
    if (!turnEndsAt) { setRemainingTime(0); return; }
    const i = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((turnEndsAt - now) / 1000);
        if (diff >= 0) {
            setRemainingTime(diff);
        } else {
            setRemainingTime(0);
            if (roundActive) { fetch("/api/game").catch(console.error); }
            clearInterval(i);
        }
    }, 1000);
    return () => clearInterval(i);
  }, [turnEndsAt, roundActive]);

  // 5. Reset Listener
  useEffect(() => {
    if (!isDataLoaded) return;
    if (!roundActive && timeline.length === 0) {
        router.push("/lobby");
    }
  }, [roundActive, timeline, isDataLoaded, router]);


  // --- AÇÕES ---
  const confirmDragGuess = async () => {
      if (!dragCard || !hoverYear || !myUid) return;
      if (myUid !== currentPlayerId) { alert("Não é sua vez!"); setDragCard(null); return; }

      setMyHand(prev => prev.filter(c => c.id !== dragCard.id));
      setDragCard(null); setHoverYear(null);

      await fetch("/api/game", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "place_guess", playerId: myUid, cardId: dragCard.id, guessedYear: hoverYear })
      });
  };

  const handleMobileCardClick = (card: Card) => {
      if (myUid !== currentPlayerId) return; 
      setSelectedCard(card);
      setInputYear(""); 
  };

  const confirmMobileGuess = async () => {
      if (!selectedCard || !inputYear || !myUid) return;
      const yearInt = parseInt(inputYear);
      if (isNaN(yearInt)) return; 
      if (yearInt < 1 || yearInt > 2025) {
          alert("Ano inválido! Escolha entre 1 e 2025.");
          return;
      }
      const cardId = selectedCard.id;
      setSelectedCard(null); 
      setMyHand(prev => prev.filter(c => c.id !== cardId));

      await fetch("/api/game", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "place_guess", playerId: myUid, cardId: cardId, guessedYear: yearInt })
      });
  };

  const handleReset = async () => {
      await fetch("/api/game", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ action: "reset_match" })
      });
  };

  const getYearFromX = (x: number) => {
      if (!timelineRef.current) return 2025;
      const rect = timelineRef.current.getBoundingClientRect();
      const availableWidth = rect.width - (PADDING_X * 2);
      const relativeX = x - rect.left - PADDING_X;
      let pct = relativeX / availableWidth;
      pct = Math.max(0, Math.min(1, pct));
      const year = Math.round(pct * 2025);
      return Math.max(1, year); 
  };

  const calculatePoints = (guessed: number, actual: number) => {
    const diff = Math.abs(guessed - actual);
    return Math.round(100 * (1 / (1 + diff / 50)));
  };

  if (!myUid || !isDataLoaded) return <div className="p-10 text-center text-slate-500">Sincronizando jogo...</div>;

  const isMyTurn = myUid === currentPlayerId;
  const currentPlayerName = players.find(p => p.id === currentPlayerId)?.name || "Ninguém";
  const winner = players.find(p => p.hand.length === 0 && players.length > 0);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const yearVal = parseInt(inputYear);
  const isInputInvalid = inputYear !== "" && (!isNaN(yearVal) && (yearVal < 1 || yearVal > 2025));
  const isButtonDisabled = !inputYear || isInputInvalid || isNaN(yearVal);

  return (
    <div 
        className="flex flex-col h-screen bg-slate-50 select-none relative overflow-hidden" 
        onMouseUp={() => { if(!isMobile && dragCard) confirmDragGuess(); }} 
    >
        {/* --- [MOBILE] MODAL DE INPUT (Mantido Igual) --- */}
        {isMobile && selectedCard && (
            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Qual é o ano?</h3>
                    <img src={selectedCard.imageUrl} className="w-32 h-32 object-cover rounded-lg mx-auto mb-4 shadow-md bg-gray-200" />
                    <div className="font-bold text-xl text-slate-900 mb-6">{selectedCard.title}</div>
                    <div className="mb-6">
                        <input 
                            type="number" min="1" max="2025" value={inputYear} onChange={(e) => setInputYear(e.target.value)} placeholder="Ex: 1990" autoFocus
                            className={`w-full text-center text-3xl font-mono font-bold border-b-2 py-2 focus:outline-none rounded ${isInputInvalid ? 'border-red-500 text-red-600 bg-red-50' : 'border-purple-500 focus:bg-purple-50'}`}
                        />
                        {isInputInvalid ? <p className="text-xs text-red-500 font-bold mt-2 animate-pulse">O ano deve ser entre 1 e 2025</p> : <p className="text-xs text-slate-400 mt-2">Digite o ano do evento</p>}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setSelectedCard(null)} className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300">Cancelar</button>
                        <button onClick={confirmMobileGuess} disabled={isButtonDisabled} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Confirmar</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- MODAL VITÓRIA (Mantido Igual) --- */}
        {winner && !roundActive && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-4 border-purple-500">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Fim de Jogo!</h2>
                    <p className="text-xl text-purple-600 font-bold mb-6">{winner.id === myUid ? "VOCÊ VENCEU!" : `${winner.name} Venceu!`}</p>
                    <div className="bg-slate-100 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Placar Final</h3>
                        {sortedPlayers.map((p, i) => (
                            <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold w-6 ${i===0 ? 'text-yellow-500 text-xl' : 'text-slate-400'}`}> {i===0 ? '1º' : `${i+1}º`} </span>
                                    <span className="font-medium text-slate-700">{p.name}</span>
                                </div>
                                <span className="font-bold text-slate-900">{p.score} pts</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleReset} className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition transform hover:scale-105">Voltar ao Lobby</button>
                </div>
            </div>
        )}

        {/* --- HEADER RESPONSIVO REDESENHADO --- */}
        {/* Usamos flex-col no mobile e flex-row no desktop (md) */}
        <header className="bg-white shadow z-10 shrink-0 flex flex-col md:flex-row">
            
            {/* PARTE 1: Informações e Timer (Topo) */}
            <div className="flex justify-between items-center p-4 w-full md:w-auto md:flex-1 md:border-r border-slate-100">
                <div>
                   <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600 text-4xl">hourglass_top</span>
                        <h1 className="font-bold text-xl text-slate-800 hidden sm:block">Timeline Game</h1>
                   </div>
                   <div className="text-sm text-slate-500 mt-1">
                      Vez de: <span className="font-bold text-purple-600">{currentPlayerName}</span>
                   </div>
                </div>
                
                {/* Timer sempre fixo à direita deste bloco */}
                <div className={`text-4xl font-mono font-bold ml-4 ${remainingTime < 10 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                   {remainingTime}s
                </div>
            </div>

            {/* PARTE 2: Lista de Jogadores (Abaixo no mobile, Lado no desktop) */}
            {/* Adicionei um background (bg-slate-50) e borda para delimitar bem a área */}
            <div className="w-full md:w-auto bg-slate-50 md:bg-white border-t md:border-t-0 md:border-l border-slate-200 flex items-center px-4 py-3 md:py-0 overflow-x-auto scrollbar-hide shadow-inner md:shadow-none">
                <div className="flex gap-4 items-center">
                    {players.map(p => {
                        const isActive = p.id === currentPlayerId;
                        return (
                            <div key={p.id} className={`relative flex flex-col items-center transition-all duration-300 px-3 py-1.5 rounded-xl shrink-0 border-2 ${isActive ? 'bg-white border-purple-500 shadow-md scale-105' : 'bg-transparent border-transparent opacity-60 grayscale'}`}>
                                <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-purple-700' : 'text-slate-500'}`}>{p.name}</div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 text-xs">{p.score} pts</span>
                                    <div className="w-px h-3 bg-slate-300"></div>
                                    <div className="flex items-center gap-1 text-purple-600">
                                        <span className="text-xs font-bold">{p.hand.length}</span>
                                        <span className="material-symbols-outlined text-[14px]">style</span>
                                    </div>
                                </div>
                                {/* Indicador visual extra para vez atual */}
                                {isActive && <div className="absolute -bottom-1 w-2 h-2 bg-purple-500 rounded-full"></div>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </header>

        {/* TIMELINE (Área Principal) */}
        <div 
            ref={timelineRef}
            className="flex-1 relative bg-slate-200 border-y border-slate-300 shadow-inner cursor-crosshair w-full px-10"
            onMouseMove={(e) => !isMobile && dragCard && setHoverYear(getYearFromX(e.clientX))}
        >
            <div className="relative w-full h-full">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-400 -translate-y-1/2"></div>
                <div className="absolute bottom-2 left-0 text-xs text-slate-500 font-mono font-bold">1 DC</div>
                <div className="absolute bottom-2 right-0 text-xs text-slate-500 font-mono font-bold">2025 DC</div>

                {timeline.map((item, idx) => {
                    const leftPct = (item.guessedYear / 2025) * 100;
                    const isExact = item.guessedYear === item.card.year;
                    const points = calculatePoints(item.guessedYear, item.card.year);

                    return (
                        <div 
                            key={idx} 
                            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 group z-10 hover:z-20 hover:scale-110 origin-bottom"
                            style={{ left: `${leftPct}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className={`w-0.5 h-8 mb-1 ${item.isTemporary ? 'bg-yellow-500' : 'bg-slate-800'}`}></div>
                            <div className={`p-1 rounded shadow-md w-24 text-center bg-white border-2 ${item.isTemporary ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-200'}`}>
                                <div className="text-[9px] font-bold truncate text-slate-800 leading-tight mb-1">{item.card.title}</div>
                                {item.card.imageUrl && (
                                    <img src={item.card.imageUrl} className="w-full h-14 object-cover rounded bg-gray-100 mb-1" alt="" />
                                )}
                                <div className={`text-[10px] font-mono font-bold ${item.isTemporary ? 'text-yellow-600' : 'text-purple-700'}`}>
                                    {item.guessedYear}
                                </div>
                                {!item.isTemporary && (
                                    <div className="mt-1 pt-1 border-t border-slate-100 animate-fade-in bg-green-50 rounded-b">
                                        <div className={`text-[9px] font-bold ${isExact ? 'text-green-600' : 'text-slate-500'}`}>Real: {item.card.year}</div>
                                        <div className="text-[9px] font-extrabold text-green-700">+{points} pts</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
                
                {!isMobile && dragCard && hoverYear !== null && (
                    <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-50 flex flex-col items-center" style={{ left: `${(hoverYear / 2025) * 100}%`, transform: 'translate(-50%, -50%)' }}>
                        <div className="bg-purple-600 text-white font-bold px-3 py-1 rounded-full mb-2 text-sm shadow-xl animate-bounce">{hoverYear}</div>
                        <div className="w-28 bg-white p-1 rounded-lg border-2 border-purple-600 shadow-2xl rotate-3"><img src={dragCard.imageUrl} className="w-full h-20 object-cover rounded" /></div>
                    </div>
                )}
            </div>
        </div>

        {/* MÃO (HAND) (Mantido Igual) */}
        <div className={`h-48 md:h-56 p-4 flex flex-col items-center justify-center transition-colors duration-500 ${isMyTurn ? 'bg-purple-50' : 'bg-white'}`}>
            {!roundActive && !winner && <p className="text-slate-400 font-bold animate-pulse">Carregando rodada...</p>}
            
            {!isMyTurn && roundActive && (
                <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-xl">hourglass_empty</span>
                    <span className="font-bold text-sm">Aguardando {currentPlayerName}...</span>
                </div>
            )}

            {isMyTurn && roundActive && (
                <div className="mb-2 px-4 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-bold animate-pulse">
                    {isMobile ? "SUA VEZ! TOQUE EM UMA CARTA" : "SUA VEZ! ARRASTE UMA CARTA"}
                </div>
            )}
            
            <div className="flex gap-3 md:gap-6 overflow-x-auto w-full justify-center px-4 py-2 pb-4 scrollbar-hide">
                {myHand.map(card => (
                    <div 
                        key={card.id}
                        onMouseDown={() => !isMobile && isMyTurn && setDragCard(card)}
                        onClick={() => isMobile && isMyTurn && handleMobileCardClick(card)}
                        className={`relative w-28 md:w-32 flex-shrink-0 bg-white rounded-xl shadow-md border border-slate-100 transition-all duration-300 select-none ${isMyTurn ? 'cursor-pointer hover:-translate-y-3 hover:shadow-xl hover:border-purple-300 hover:rotate-1 active:scale-95' : 'opacity-60 grayscale filter cursor-not-allowed'}`}
                    >
                        <img src={card.imageUrl} className="w-full h-24 object-cover rounded-lg mb-2 bg-gray-100" draggable={false} />
                        <div className="text-center font-bold text-[10px] md:text-xs text-slate-700 leading-tight h-8 flex items-center justify-center">{card.title}</div>
                        {isMyTurn && <div className="absolute -inset-1 bg-purple-400/20 blur-sm rounded-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>}
                    </div>
                ))}
                {myHand.length === 0 && roundActive && (
                    <div className="text-center text-slate-400 text-sm italic flex flex-col items-center">
                        <span>🤲</span><span>Sem cartas...</span><span className="text-[10px]">(Aguardando finalização)</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}