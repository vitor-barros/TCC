import { NextRequest, NextResponse } from "next/server";
import game from "@/services/GameManager";
import { Player } from "@/model/Player";

export async function GET() {
  return NextResponse.json({
    players: game.players,
    timeline: game.timeline,
    currentPlayer: game.currentPlayer,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nome do jogador é obrigatório." }, { status: 400 });
    }

    const player = new Player(name);
    game.addPlayer(player);

    return NextResponse.json({
      message: "Jogador adicionado com sucesso!",
      player,
      totalPlayers: game.players.length
    });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao adicionar jogador." }, { status: 500 });
  }
}
