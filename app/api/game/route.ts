import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/firebase";
import { ref, get, set } from "firebase/database";
import { GameManager } from "@/services/GameManager";
import { Card } from "@/model/Card";

const ROOM_ID = "sala_unica"; 

async function loadGame(): Promise<GameManager> {
  const gm = new GameManager();
  const snapshot = await get(ref(db, ROOM_ID));
  if (snapshot.exists()) {
    gm.fromJSON(snapshot.val());
  }
  return gm;
}

async function saveGame(gm: GameManager) {
  await set(ref(db, ROOM_ID), gm.toJSON());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  const game = await loadGame();
  
  // Verifica se o tempo do turno atual estourou ANTES de processar qualquer coisa
  game.checkTurnExpiration();

  let resData: any = { ok: false, error: "Unknown action" };

  try {
    switch (action) {
      case "add_player":
        // OBRIGATÓRIO: Passar UID e Name
        if (body.name && body.uid) {
            const p = game.addPlayer(body.uid, body.name);
            if(p) resData = { ok: true, player: p };
            else resData = { ok: false, error: "Cannot join now" };
        }
        break;

      case "seed_cards":
        const rawCards = body.cards || [];
        const deck = rawCards.map((c: any) => new Card(c.id, c.title, c.imageUrl, c.year));
        resData = game.seedAndDistribute(deck);
        break;

      case "start_round":
        // duration aqui vira o tempo POR TURNO
        resData = game.startRound(body.duration);
        break;

      case "place_guess":
        resData = game.placeGuess(body.playerId, body.cardId, Number(body.guessedYear));
        break;

      case "reset_match":
        game.resetMatch();
        resData = { ok: true };
        break;
    }
  } catch (e: any) {
      console.error(e);
      resData = { ok: false, error: e.message };
  }

  await saveGame(game);
  return NextResponse.json(resData);
}

// GET para debug ou initial load
export async function GET() {
    const game = await loadGame();
    game.checkTurnExpiration(); 
    await saveGame(game); // Salva caso tenha pulado turno no check
    return NextResponse.json(game.toJSON());
}