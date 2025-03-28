import React, { useRef } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useGameLoop(canvasRef);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="bg-white rounded-lg shadow-2xl"
        />
        {!gameState.gameOver && (
          <div className="absolute top-4 left-4 text-white">
            <p className="text-lg">Use ← → to move</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;