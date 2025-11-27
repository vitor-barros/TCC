"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function TutorialPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f6f6f8] font-sans text-gray-800 selection:bg-purple-200">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-10 bg-[#f6f6f8]/80 backdrop-blur-sm border-b border-purple-600/20">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-purple-600 text-4xl">
              hourglass_top
            </span>
            <h1 className="text-xl font-bold text-gray-900">Timeline Game</h1>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* HERO SECTION */}
          <header className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Como Jogar
            </h2>
            <p className="text-lg text-gray-600">
              Aprenda as regras e torne-se um mestre da história!
            </p>
          </header>

          <div className="space-y-20">
            
            {/* PASSO 1: CARTAS */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-800">1</div>
                  <h3 className="text-2xl font-bold text-gray-900">Suas Cartas</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Você recebe cartas com eventos históricos e imagens, mas <strong>o ano está oculto</strong>. Seu objetivo é descobrir quando esses eventos aconteceram.
                </p>
              </div>
              
              {/* Ilustração Visual (Simulando uma carta) */}
              <div className="order-1 md:order-2 flex justify-center">
                <div className="w-48 h-64 bg-white rounded-xl shadow-xl border border-gray-100 p-3 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined text-4xl">image</span>
                        </div>
                    </div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                    <div className="absolute bottom-3 right-3 text-zinc-400 font-bold text-xl">????</div>
                </div>
              </div>
            </div>

            {/* PASSO 2: INPUT (MUDANÇA CRÍTICA AQUI) */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center relative">
                 {/* Ilustração Visual (Simulando o Modal de Input) */}
                 <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 text-center relative z-10">
                    <div className="text-gray-800 font-bold mb-4">Invenção da Lâmpada</div>
                    <div className="w-full border-b-2 border-purple-500 mb-2">
                        <span className="text-3xl font-mono font-bold text-gray-800">1879</span>
                    </div>
                    <div className="mt-4 bg-purple-600 text-white text-xs font-bold py-2 rounded-lg">CONFIRMAR</div>
                 </div>
                 {/* Fundo escuro simulando modal */}
                 <div className="absolute inset-0 bg-black/10 rounded-3xl transform scale-110 -z-0 blur-sm"></div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-200 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-400">2</div>
                  <h3 className="text-2xl font-bold text-gray-900">Selecione e Arraste</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                    Na sua vez de jogar, <strong>arraste ou clique na carta</strong> que pretende usar. Pense na ordem das cartas e como elas afetam a partida. 
                    Cada decisão pode abrir vantagem ou deixar uma oportunidade passar.
                </p>
              </div>
            </div>

            {/* PASSO 3: FEEDBACK */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-amber-800">3</div>
                  <h3 className="text-2xl font-bold text-gray-900">Linha do Tempo</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  Após confirmar, sua carta vai para a Linha do Tempo. O jogo revela o ano real e calcula seus pontos baseados na <strong>precisão</strong> do seu palpite.
                </p>
              </div>
              
               {/* Ilustração Visual (Timeline) */}
              <div className="order-1 md:order-2">
                 <div className="bg-gray-200 h-1 w-full relative rounded flex items-center justify-between px-2 mt-8">
                    {/* Item 1 */}
                    <div className="bg-white p-2 rounded shadow border border-gray-300 w-20 text-center absolute -top-10 left-[10%]">
                        <div className="text-[10px] font-bold text-purple-700">1500</div>
                    </div>
                    {/* Item 2 */}
                    <div className="bg-white p-2 rounded shadow border-2 border-purple-500 w-24 text-center absolute -top-12 left-[50%] transform -translate-x-1/2 z-10 scale-110">
                        <div className="text-[8px] text-gray-500">Sua Carta</div>
                        <div className="text-xs font-bold text-purple-700">1822</div>
                    </div>
                    {/* Item 3 */}
                    <div className="bg-white p-2 rounded shadow border border-gray-300 w-20 text-center absolute -top-10 right-[10%]">
                        <div className="text-[10px] font-bold text-purple-700">2000</div>
                    </div>
                 </div>
              </div>
            </div>

            {/* PASSO 4: VITÓRIA */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center">
                  <div className="text-9xl">🏆</div>
              </div>
              
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-400 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-red-800">4</div>
                  <h3 className="text-2xl font-bold text-gray-900">Vença a Partida</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  O objetivo é esvaziar a sua mão e terminar a partida com a maior pontuação. Quem tiver mais pontos vence o jogo!
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-20 mb-12">
            <button 
                onClick={() => router.push("/")}
                className="bg-green-500 text-white font-bold text-xl py-5 px-16 rounded-2xl hover:bg-green-600 hover:shadow-2xl hover:shadow-green-500 transition-all transform hover:-translate-y-1"
            >
              Voltar para tela inicial!
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-gray-500">
          <p>© 2025 Timeline Game. Feito para o TCC.</p>
        </div>
      </footer>
    </div>
  );
}