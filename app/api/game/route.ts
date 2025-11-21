import { NextRequest, NextResponse } from "next/server";
import game from "@/services/GameManager";
import { Card } from "@/model/Card";

export async function GET() {
  return NextResponse.json(game.getState());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "add_player") {
    const { name } = body;
    if (!name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
    const player = game.addPlayer(name);
    return NextResponse.json({ ok: true, player: { id: player.id, name: player.name } });
  }

  if (action === "seed_cards") {
    const cards = (body.cards || []) as Array<{ id: string; title: string; imageUrl: string; year: number }>;
    const cardsPerPlayer = Number(body.cardsPerPlayer || 3);
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ ok: false, error: "cards required" }, { status: 400 });
    }
    const modelCards = cards.map((c) => new Card(c.id, c.title, c.imageUrl, c.year));
    const res = game.seedAndDistribute(modelCards, cardsPerPlayer);
    // NÃO espalhar ok duas vezes. retornar res diretamente.
    return NextResponse.json(res);
  }

  if (action === "start_round") {
    const duration = body.duration ?? undefined;
    const res = game.startRound(duration);
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    return NextResponse.json(res);
  }

  if (action === "place_guess") {
    const { playerId, cardId, guessedYear } = body;
    if (!playerId) return NextResponse.json({ ok: false, error: "playerId required" }, { status: 400 });
    if (!cardId) return NextResponse.json({ ok: false, error: "cardId required" }, { status: 400 });
    const res = game.placeGuess(playerId, String(cardId), Number(guessedYear));
    if (!res.ok) return NextResponse.json(res, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "confirm_round") {
    const res = game.confirmRoundEarly();
    return NextResponse.json(res);
  }

  if (action === "reset_match") {
    game.resetMatch();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
