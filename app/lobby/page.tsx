"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { onValue, ref, set } from "firebase/database"; // Importei 'set' para forçar limpeza se precisar
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
        console.log("Auth detectado:", user.uid);
        setMyUid(user.uid);
      } else {
        console.log("Fazendo login anônimo...");
        signInAnonymously(auth).catch((err) => {
            console.error("Erro Auth:", err);
            setStatus("Erro de Autenticação: " + err.message);
        });
      }
    });
    return () => unsub();
  }, []);

  // 2. Listener do Firebase
  useEffect(() => {
    const roomRef = ref(db, "sala_unica/players");
    const unsub = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Garante que tratamos objeto ou array corretamente
        const list = Array.isArray(data) ? data : Object.values(data);
        // Remove itens nulos que podem aparecer em arrays esparsos
        const cleanList = list.filter(item => item && item.id);
        setPlayersOnServer(cleanList as any[]);
      } else {
        setPlayersOnServer([]);
      }
    });
    return () => unsub();
  }, []);

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
      await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_round", duration: duration }),
      });

      // 3. Redirecionar
      router.push("/jogar");
    } catch (e) {
      setStatus("Erro ao iniciar.");
    } finally {
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

  // LÓGICA CRÍTICA
  const amIInList = playersOnServer.some(p => p.id === myUid);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      
      {/* --- DEBUGGER PANEL (REMOVA DEPOIS QUE FUNCIONAR) --- */}
      <div className="w-full max-w-md bg-black text-green-400 p-4 text-xs font-mono mb-4 rounded overflow-hidden">
          <p><strong>STATUS DE DIAGNÓSTICO:</strong></p>
          <p>Meu UID Local: <span className="text-white">{myUid || "Carregando..."}</span></p>
          <p>Estou na lista? {amIInList ? "SIM (Botão deve aparecer)" : "NÃO (Botão oculto)"}</p>
          <hr className="border-gray-700 my-2"/>
          <p><strong>Jogadores no Banco ({playersOnServer.length}):</strong></p>
          {playersOnServer.map(p => (
              <div key={p.id} className={p.id === myUid ? "bg-green-900" : ""}>
                  [{p.id}] - {p.name} {p.id === myUid ? "<-- ESSE SOU EU" : ""}
              </div>
          ))}
      </div>
      {/* ----------------------------------------------------- */}

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-slate-800">Lobby Multiplayer</h1>
        <p className="text-sm text-slate-500 mb-6">Convide amigos. Todos devem acessar esta página.</p>

        {/* LISTA DE JOGADORES */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jogadores na Sala</h3>
          <div className="space-y-2">
            {playersOnServer.length === 0 && <p className="text-gray-400 italic">Sala vazia...</p>}
            {playersOnServer.map((p, i) => (
               <div key={p.id || i} className={`p-3 rounded-lg flex justify-between items-center ${p.id === myUid ? 'bg-purple-100 border border-purple-300' : 'bg-gray-50'}`}>
                  <span className="font-semibold">{i+1}. {p.name}</span>
                  {p.id === myUid && <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">VOCÊ</span>}
               </div>
            ))}
          </div>
        </div>

        {/* FORMULÁRIO DE ENTRADA */}
        {!amIInList ? (
           <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Seu Nome</label>
              <input 
                type="text" 
                value={myName} 
                onChange={e => setMyName(e.target.value)} 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Seu Nome"
              />
              <button 
                onClick={handleJoin} 
                disabled={loading || !myName}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Entrar na Sala"}
              </button>
           </div>
        ) : (
           /* CONTROLES DO JOGO (Só aparecem se o UID bater) */
           <div className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Tempo por Turno</label>
                 <div className="flex gap-2">
                    {[15, 30, 60].map(sec => (
                       <button 
                         key={sec} onClick={() => setDuration(sec)}
                         className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${duration === sec ? 'bg-slate-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                       >
                         {sec}s
                       </button>
                    ))}
                 </div>
              </div>

              <button 
                onClick={handleStartMatch} 
                disabled={loading || playersOnServer.length < 1}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "Iniciando..." : "INICIAR PARTIDA 🚀"}
              </button>
              
              <button onClick={() => router.push("/jogar")} className="block w-full text-center text-sm text-purple-600 underline">
                Voltar para o Jogo
              </button>
           </div>
        )}

        <div className="mt-4 text-center text-sm text-gray-500 min-h-[24px]">{status}</div>
        
        {/* NUCLEAR RESET */}
        <button onClick={forceNuclearReset} className="mt-8 w-full py-2 border border-red-200 text-red-400 text-xs rounded hover:bg-red-50">
           [DEBUG] Limpar Banco de Dados (Reset Total)
        </button>
      </div>
    </div>
  );
}