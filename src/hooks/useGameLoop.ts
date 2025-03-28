import { useEffect, useRef } from 'react';
import { GameState, Platform, Player } from '../types/game';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLATFORM_WIDTH = 85;
const PLATFORM_COUNT = 7;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const GRAVITY = 0.4;
const JUMP_FORCE = -12;

export const useGameLoop = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const gameState = useRef<GameState>({
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      velocityY: 0,
      velocityX: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
    },
    platforms: [],
    score: 0,
    gameOver: false,
    highScore: 0,
  });

  const generatePlatforms = () => {
    const platforms: Platform[] = [];
    
    // Add starting platform directly under the player
    platforms.push({
      x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      width: PLATFORM_WIDTH,
    });

    // Generate remaining platforms with good initial spacing
    for (let i = 1; i < PLATFORM_COUNT; i++) {
      platforms.push({
        x: Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH),
        y: CANVAS_HEIGHT - (CANVAS_HEIGHT / PLATFORM_COUNT) * i - 50,
        width: PLATFORM_WIDTH,
      });
    }
    return platforms;
  };

  const resetGame = () => {
    const currentHighScore = gameState.current.highScore;
    gameState.current = {
      player: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 100,
        velocityY: JUMP_FORCE, // Start with an initial jump
        velocityX: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      },
      platforms: generatePlatforms(),
      score: 0,
      gameOver: false,
      highScore: currentHighScore,
    };
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const { player } = gameState.current;
    if (e.key === 'ArrowLeft') {
      player.velocityX = -5;
    } else if (e.key === 'ArrowRight') {
      player.velocityX = 5;
    } else if (e.key === ' ' && gameState.current.gameOver) {
      resetGame();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const { player } = gameState.current;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      player.velocityX = 0;
    }
  };

  const update = () => {
    const { player, platforms } = gameState.current;

    // Update player position
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    player.x += player.velocityX;

    // Wrap player horizontally
    if (player.x > CANVAS_WIDTH) {
      player.x = 0;
    } else if (player.x < 0) {
      player.x = CANVAS_WIDTH;
    }

    // Check for game over
    if (player.y > CANVAS_HEIGHT) {
      gameState.current.gameOver = true;
      if (gameState.current.score > gameState.current.highScore) {
        gameState.current.highScore = gameState.current.score;
      }
      return;
    }

    // Platform collision detection
    platforms.forEach((platform) => {
      if (
        player.velocityY > 0 &&
        player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y + player.height > platform.y &&
        player.y + player.height < platform.y + 20
      ) {
        player.velocityY = JUMP_FORCE;
      }
    });

    // Camera and score
    if (player.y < CANVAS_HEIGHT / 2) {
      const diff = CANVAS_HEIGHT / 2 - player.y;
      player.y = CANVAS_HEIGHT / 2;
      gameState.current.score += Math.floor(diff);

      platforms.forEach((platform) => {
        platform.y += diff;
        if (platform.y > CANVAS_HEIGHT) {
          platform.y = 0;
          platform.x = Math.random() * (CANVAS_WIDTH - platform.width);
        }
      });
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { player, platforms, score, gameOver, highScore } = gameState.current;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw platforms
    ctx.fillStyle = '#95a5a6';
    platforms.forEach((platform) => {
      ctx.fillRect(platform.x, platform.y, platform.width, 15);
    });

    // Draw player
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw score
    ctx.fillStyle = '#2c3e50';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`High Score: ${highScore}`, 10, 60);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2 - 70, CANVAS_HEIGHT / 2);
      ctx.font = '20px Arial';
      ctx.fillText(
        'Press Space to Restart',
        CANVAS_WIDTH / 2 - 90,
        CANVAS_HEIGHT / 2 + 40
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resetGame();

    let animationFrameId: number;

    const gameLoop = () => {
      if (!gameState.current.gameOver) {
        update();
      }
      draw(ctx);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasRef]);

  return gameState.current;
};