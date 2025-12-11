"use client";

import React from "react";
import { useRouter } from "next/navigation";




export default function HomeScreen() {

  const router = useRouter();
  function handlePlayClick() {
    router.push("/lobby");
  }
  function handlePlayClick2() {
    router.push("/tutorial");
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#f9f9fb] overflow-hidden px-4">
      {/* Ícones de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="material-symbols-outlined absolute top-[10%] left-[5%] !text-5xl text-[#a98aff]/20 animate-float">
          hourglass_empty
        </span>
        <span className="material-symbols-outlined absolute top-[20%] right-[10%] !text-5xl text-[#a98aff]/20 animate-float">
          lightbulb
        </span>
        <span className="material-symbols-outlined absolute bottom-[15%] left-[15%] !text-4xl text-[#a98aff]/20 animate-float">
          public
        </span>
        <span className="material-symbols-outlined absolute bottom-[25%] right-[20%] !text-5xl text-[#a98aff]/20 animate-float">
          auto_stories
        </span>
        <span className="material-symbols-outlined absolute top-[50%] left-[25%] !text-5xl text-[#a98aff]/20 animate-float">
          rocket_launch
        </span>
        <span className="material-symbols-outlined absolute top-[60%] right-[30%] !text-5xl text-[#a98aff]/20 animate-float">
          castle
        </span>
      </div>

      {/* conteúdo */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm space-y-6">
        {/* título */}
        <h1 className="text-5xl md:text-6xl font-extrabold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9a4dff] to-[#7d2cff]">
            Timeline
          </span>{" "}
          <span className="text-gray-900">Game</span>
        </h1>

        {/* botão principal */}
        <button 
          onClick={handlePlayClick}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#7d2cff] text-white text-lg font-semibold rounded-xl shadow-md hover:bg-[#6825d4] transition-all duration-300 transform hover:scale-[1.02]">
          <span className="material-symbols-outlined">play_circle</span>
          Jogar
        </button>

        {/* secundarios */}
        <div className="w-full flex flex-col gap-3">
          <button onClick={handlePlayClick2}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300">
            <span className="material-symbols-outlined">help</span>
            Como Jogar
          </button>

          {/* <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center gap-1 py-3 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300">
              <span className="material-symbols-outlined text-3xl">person</span>
              Perfil
            </button>
            <button className="flex flex-col items-center justify-center gap-1 py-3 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all duration-300">
              <span className="material-symbols-outlined text-3xl">settings</span>
              Ajustes
            </button>
          </div> */}

          {/* <button className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#4285F4] text-white font-semibold rounded-xl shadow-md hover:bg-[#357ae8] transition-all duration-300 transform hover:scale-[1.02]">
            <span className="material-symbols-outlined">account_circle</span>
            Entrar com Google
          </button> */}

          {/* <button className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#d4b9ff] text-[#4b1c9b] font-semibold rounded-xl hover:bg-[#caa4ff] transition-all duration-300 transform hover:scale-[1.02]">
            <span className="material-symbols-outlined">group_add</span>
            Criar Sala
          </button> */}
        </div>

        {/* rodapé */}
        <footer className="pt-6 text-sm text-gray-500">
          © 2025 Timeline Game. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}
