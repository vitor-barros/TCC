// app/lobby/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mockCardsRaw } from "../lib/mockCards";

export default function page() {
  const router = useRouter();
  const [slots, setSlots] = useState<string[]>(["", "", "", ""]); // 4 slots fixed
  const [duration, setDuration] = useState<number>(30);
  const [playersServer, setPlayersServer] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // polling to keep UI in sync with server
    let mounted = true;
    async function fetchState() {
      try {
        const res = await fetch("/api/game");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setPlayersServer(Array.isArray(data.players) ? data.players.map((p: any) => ({ id: p.id, name: p.name })) : []);
      } catch (e) {
        // ignore network hiccups
      }
    }
    fetchState();
    const id = window.setInterval(fetchState, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  function updateSlot(index: number, value: string) {
    const copy = [...slots];
    copy[index] = value;
    setSlots(copy);
  }

  const nonEmpty = slots.filter((s) => s.trim() !== "");

  // Add players to server (calls add_player for each filled slot)
  async function addPlayersToServer() {
    setLoading(true);
    setStatus("Adicionando jogadores...");
    for (const name of nonEmpty) {
      try {
        await fetch("/api/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_player", name: name.trim() }),
        });
      } catch (err) {
        console.error("add_player error", err);
      }
    }
    // give server a moment to update
    await new Promise((r) => setTimeout(r, 500));
    setStatus("Jogadores adicionados.");
    setLoading(false);
  }

  // Seed cards (send mockCards) and start the first round
  async function seedAndStart() {
    if (nonEmpty.length === 0) return;
    setLoading(true);
    setStatus("Seedando cartas no servidor...");

    // Prepare payload from mockCardsRaw
    const cardsPayload = mockCardsRaw.map((c) => ({
      id: c.id,
      title: c.title,
      imageUrl: c.imageUrl,
      year: c.year,
    }));

    try {
      // seed_cards -> distributes cards to players (server-side)
      const seedRes = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_cards", cards: cardsPayload, cardsPerPlayer: 3 }),
      });
      const seedJson = await seedRes.json();
      if (!seedRes.ok || !seedJson.ok) {
        setStatus("Erro ao seedar cartas: " + (seedJson?.error ?? seedRes.statusText));
        setLoading(false);
        return;
      }

      setStatus("Iniciando rodada...");
      // start_round with configured duration
      const startRes = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_round", duration }),
      });
      const startJson = await startRes.json();
      if (!startRes.ok || !startJson.ok) {
        setStatus("Erro ao iniciar rodada: " + (startJson?.error ?? startRes.statusText));
        setLoading(false);
        return;
      }

      setStatus("Partida iniciada! Entrando na partida...");
      // allow small delay for server to settle state
      await new Promise((r) => setTimeout(r, 400));
      router.push("/jogar");
    } catch (err) {
      console.error(err);
      setStatus("Erro de rede ao iniciar a partida.");
    } finally {
      setLoading(false);
    }
  }

  // Combined flow: add players (if not already added) then seed+start
  async function handleStartClick() {
    // if the players visible on the server already match our nonEmpty list, skip adding
    const existingNames = playersServer.map((p) => p.name);
    const needAdd = nonEmpty.some((n) => !existingNames.includes(n.trim()));

    if (needAdd) {
      await addPlayersToServer();
      // fetch updated players
      await new Promise((r) => setTimeout(r, 300));
    }

    await seedAndStart();
  }

  return (
    <div className="min-h-screen bg-[#f9f9fb] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Lobby</h2>
          <p className="text-slate-500">Adicione de 1 a 4 jogadores e configure a duração da rodada em segundos.</p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Players (slots)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slots.map((s, i) => (
                <input
                  key={i}
                  value={s}
                  onChange={(e) => updateSlot(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-500">Slots vazios serão ignorados. Mínimo 1 jogador para iniciar.</p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Round Timer (seconds)</h3>
            <input
              type="number"
              min={5}
              max={300}
              value={duration}
              onChange={(e) => setDuration(Math.max(5, Math.min(300, Number(e.target.value) || 30)))}
              className="w-44 px-4 py-3 rounded-xl border border-slate-200"
            />
            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => setDuration(15)} className="px-3 py-1 rounded-md bg-gray-100">15s</button>
              <button onClick={() => setDuration(30)} className="px-3 py-1 rounded-md bg-gray-100">30s</button>
              <button onClick={() => setDuration(60)} className="px-3 py-1 rounded-md bg-gray-100">60s</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Players already on server</h3>
            <div className="flex gap-2 flex-wrap">
              {playersServer.length === 0 && <div className="text-sm text-slate-500">Nenhum jogador presente no servidor</div>}
              {playersServer.map((p) => (
                <div key={p.id} className="px-3 py-2 bg-gray-100 rounded-lg">{p.name}</div>
              ))}
            </div>
          </div>
            {/* DEBUG PANEL */}
<div className="mt-6 p-4 border border-red-300 bg-red-50 rounded-xl space-y-3">
  <h3 className="text-red-700 font-bold text-sm">DEBUG PANEL</h3>

  <button
    onClick={async () => {
      const r = await fetch("/api/game");
      console.log("GET /api/game →", await r.json());
    }}
    className="px-3 py-2 bg-white border border-red-300 rounded-lg text-sm"
  >
    Test: GET state
  </button>

  <button
    onClick={async () => {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_match" }),
      });
      console.log("POST reset_match →", await r.json());
    }}
    className="px-3 py-2 bg-white border border-red-300 rounded-lg text-sm"
  >
    Test: reset_match
  </button>

  <button
    onClick={async () => {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_player", name: "DebugPlayer" }),
      });
      console.log("POST add_player →", await r.json());
    }}
    className="px-3 py-2 bg-white border border-red-300 rounded-lg text-sm"
  >
    Test: add_player
  </button>

  <button
    onClick={async () => {
      const cards = Array.from({ length: 5 }).map((_, i) => ({
        id: `debug_${i}`,
        title: `Debug Card ${i}`,
        imageUrl: "",
        year: 2000 + i,
      }));

      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seed_cards",
          cards,
          cardsPerPlayer: 2,
        }),
      });
      console.log("POST seed_cards →", await r.json());
    }}
    className="px-3 py-2 bg-white border border-red-300 rounded-lg text-sm"
  >
    Test: seed_cards
  </button>

  <button
    onClick={async () => {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_round", duration: 10 }),
      });
      console.log("POST start_round →", await r.json());
    }}
    className="px-3 py-2 bg-white border border-red-300 rounded-lg text-sm"
  >
    Test: start_round
  </button>

  <p className="text-xs text-red-700 mt-2">
    Os resultados aparecerão no console do navegador (F12 → Console).
  </p>
</div>
      
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleStartClick}
              disabled={nonEmpty.length === 0 || loading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {loading ? "Iniciando..." : "Start Match"}
            </button>

            <button onClick={() => router.push("/")} className="w-full py-3 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl">
              Cancel
            </button>

            {status && <div className="mt-3 text-sm text-gray-600">{status}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
