"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { onValue, ref, set } from "firebase/database"; 
import { auth, db } from "../lib/firebase"; 
import { mockCardsRaw } from "../lib/mockCards"; 

export default function LobbyPage() {
  const router = useRouter();
  
  // Estado local
  const [myUid, setMyUid] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [playersOnServer, setPlayersOnServer] = useState<{id:string, name:string}[]>([]);
  
  const [duration, setDuration] = useState(60); 
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  // 1. Auth Anônimo
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setMyUid(user.uid);
      } else {
        signInAnonymously(auth).catch((err) => {
            console.error("Erro Auth:", err);
            setStatus("Erro de Autenticação: " + err.message);
        });
      }
    });
    return () => unsub();
  }, []);

  // 2. Listener de Jogadores
  useEffect(() => {
    const roomRef = ref(db, "sala_unica/players");
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Array.isArray(data) ? data : Object.values(data);
        const cleanList = list.filter(item => item && item.id);
        setPlayersOnServer(cleanList as any[]);
      } else {
        setPlayersOnServer([]);
      }
    });
    return () => unsub();
  }, []);

  // 3. Listener de Configuração (Tempo)
  useEffect(() => {
    const configRef = ref(db, "sala_unica/config/duration");
    const unsub = onValue(configRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
            setDuration(val);
        }
    });
    return () => unsub();
  }, []);

  // --- LÓGICA DO HOST ---
  const isHost = playersOnServer.length > 0 && playersOnServer[0].id === myUid;
  const amIInList = playersOnServer.some(p => p.id === myUid);

  // 4. NOVO: Listener de Início de Jogo (Redirecionamento Automático)
  useEffect(() => {
    const roundRef = ref(db, "sala_unica/roundActive");
    const unsub = onValue(roundRef, (snapshot) => {
      const isActive = snapshot.val();
      
      // Se o jogo ficou ativo E eu estou na lista de jogadores
      if (isActive === true && myUid && amIInList) {
          console.log("Jogo começou! Redirecionando...");
          router.push("/jogar");
      }
    });
    return () => unsub();
  }, [myUid, amIInList, router]); // Dependências importantes!


  // Função para atualizar o tempo (SÓ O HOST PODE CHAMAR)
  const handleUpdateDuration = (newDuration: number) => {
      if (!isHost) return; 
      set(ref(db, "sala_unica/config/duration"), newDuration).catch(console.error);
  };

  // Entrar na sala
  const handleJoin = async () => {
    if (!myName.trim() || !myUid) return;
    setLoading(true);
    setStatus("Entrando...");

    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_player", uid: myUid, name: myName }),
      });
      const json = await res.json();
      if(json.ok) {
          setStatus("Entrou! Aguardando início...");
          if (playersOnServer.length === 0) {
              set(ref(db, "sala_unica/config/duration"), 60);
          }
      } else {
          setStatus("Erro: " + json.error);
      }
    } catch (e: any) {
      setStatus("Erro de conexão: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar Jogo
  const handleStartMatch = async () => {
    if (!isHost) return;
    if (playersOnServer.length === 0) return;
    
    setLoading(true);
    setStatus("Preparando jogo...");

    try {
      // 1. Seed Cards
      const cardsPayload = mockCardsRaw.map((c) => ({
         id: c.id, title: c.title, imageUrl: c.imageUrl, year: c.year,
      }));
      
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_cards", cards: cardsPayload, cardsPerPlayer: 3 }),
      });

      // 2. Start Round
      // Ao dar sucesso aqui, o Firebase muda 'roundActive' para true
      // e o useEffect nº 4 vai redirecionar todo mundo automaticamente.
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_round", duration: duration }),
      });

    } catch (e) {
      setStatus("Erro ao iniciar.");
      setLoading(false);
    }
  };

  // Force Reset (Limpeza bruta direto no banco, sem passar pela API, para garantir)
  const forceNuclearReset = async () => {
      if(!confirm("Isso vai apagar TUDO no banco de dados. Tem certeza?")) return;
      await set(ref(db, "sala_unica"), null);
      alert("Banco limpo. Recarregue a página.");
      window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative">
        
        {/* Título e Subtítulo */}
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800">Lobby Multiplayer</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Sala Única</p>
        </div>

        {/* LISTA DE JOGADORES */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jogadores na Sala</h3>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{playersOnServer.length} online</span>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
            {playersOnServer.length === 0 && <p className="text-gray-400 italic text-sm text-center py-4">A sala está vazia. Seja o primeiro!</p>}
            {playersOnServer.map((p, i) => (
               <div key={p.id || i} className={`p-3 rounded-lg flex justify-between items-center transition-all ${p.id === myUid ? 'bg-purple-100 border border-purple-300 shadow-sm' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 text-sm">{i+1}. {p.name}</span>
                      {i === 0 && <span className="material-symbols-outlined text-yellow-500 text-sm" title="Host da Sala">crown</span>}
                  </div>
                  {p.id === myUid && <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">VOCÊ</span>}
               </div>
            ))}
          </div>
        </div>

        {/* FORMULÁRIO DE ENTRADA */}
        {!amIInList ? (
           <div className="space-y-3 animate-fade-in">
              <label className="block text-sm font-medium text-gray-700">Seu Nome</label>
              <input 
                type="text" 
                value={myName} 
                onChange={e => setMyName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                placeholder="Ex: Viajante do Tempo"
              />
              <button 
                onClick={handleJoin} 
                disabled={loading || !myName}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? "Entrando..." : "Entrar na Sala"}
              </button>
           </div>
        ) : (
           /* CONTROLES DO JOGO */
           <div className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in">
              <div>
                 <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Tempo por Turno</label>
                    {!isHost && <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded">Apenas o Host altera</span>}
                 </div>
                 
                 <div className="flex gap-2">
                    {[15, 30, 60].map(sec => (
                       <button 
                         key={sec} 
                         onClick={() => handleUpdateDuration(sec)}
                         disabled={!isHost} 
                         className={`
                            flex-1 py-2 rounded-lg text-sm font-medium transition-colors border 
                            ${duration === sec ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}
                            ${isHost ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}
                         `}
                       >
                         {sec}s
                       </button>
                    ))}
                 </div>
              </div>

              {isHost ? (
                  <button 
                    onClick={handleStartMatch} 
                    disabled={loading || playersOnServer.length < 1}
                    className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition transform hover:scale-[1.02] disabled:opacity-50 disabled:grayscale"
                  >
                    {loading ? "Iniciando..." : "INICIAR PARTIDA"}
                  </button>
              ) : (
                  <div className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-xl text-center border-2 border-slate-200 border-dashed animate-pulse">
                      Aguardando o Host iniciar...
                  </div>
              )}
           </div>
        )}

        <div className="mt-4 text-center text-xs font-bold text-purple-600 min-h-[20px]">{status}</div>
        
        {/* NUCLEAR RESET */}
        <button onClick={forceNuclearReset} className="mt-8 w-full py-2 border border-red-200 text-red-400 text-xs rounded hover:bg-red-50">
           [DEBUG] Limpar Banco de Dados (Reset Total)
        </button>

        <button 
            onClick={() => router.push("/")}
            className="mt-6 w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm font-bold group"
        >
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Voltar ao Início
        </button>

      </div>
    </div>
  );
}