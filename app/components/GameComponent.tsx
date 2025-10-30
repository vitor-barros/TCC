"use client";

import React from "react";

export default function GamePageVisual() {
  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Timeline Game
        </h1>
        <div className="flex items-center gap-4">
          <div className="font-semibold text-sm">
            Round: <span className="text-primary">1/10</span>
          </div>
          <div className="font-semibold text-sm">
            Score: <span className="text-primary">150</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center relative">
        {/* Timeline */}
        <div className="w-full h-[60%] flex items-center overflow-x-auto p-10">
          <div className="relative h-full" style={{ width: "5000px" }}>
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 dark:bg-gray-700 -translate-y-1/2"></div>

            {/* Year markers (dummy examples) */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${i * 10}%` }}
              >
                <div className="w-px h-4 bg-gray-400 dark:bg-gray-500"></div>
                <span className="absolute -bottom-6 -translate-x-1/2 text-xs text-gray-500">
                  {i * 500 - 4000}
                </span>
              </div>
            ))}

            {/* Example event cards placed on timeline */}
            {[...Array(3)].map((_, i) => (
              <div
                key={`event-${i}`}
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ left: `${i * 15 + 10}%` }}
              >
                <div className="relative w-40 text-center flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-white dark:border-gray-800 absolute -top-2 z-20"></div>
                  <div className="card-container w-full revealed">
                    <div className="card-inner">
                      <div className="card-front p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <img
                          src="https://placekitten.com/200/100"
                          alt="Event"
                          className="w-full h-20 object-cover rounded-md mb-2"
                        />
                        <p className="text-sm font-semibold leading-tight">
                          Example Event
                        </p>
                      </div>
                      <div className="card-back p-2 bg-primary text-white rounded-xl shadow-lg flex flex-col justify-center items-center">
                        <p className="text-xl font-bold">1450</p>
                        <p className="font-bold text-yellow-300 mt-2">
                          +85 pts
                        </p>
                        <p className="text-xs mt-1">(You guessed: 1500)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hand / Actions */}
        <div className="w-full h-[40%] bg-gray-100 dark:bg-gray-900/50 p-6 flex flex-col items-center justify-center border-t border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-lg mb-4">Your Cards</h2>

          {/* Example hand cards */}
          <div className="flex gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={`hand-${i}`}
                className="w-48 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg cursor-grab hover:scale-105 hover:shadow-primary/30 transition-transform"
              >
                <img
                  src="https://placekitten.com/200/120"
                  alt="Card"
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
                <h3 className="font-bold text-center">Sample Card {i + 1}</h3>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                  Description for this event.
                </p>
              </div>
            ))}
          </div>

          {/* Example button */}
          <button className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-lg text-lg hover:bg-primary/90 transition-transform transform hover:scale-105 shadow-lg">
            Submit Guesses
          </button>
        </div>
      </main>
    </div>
  );
}
