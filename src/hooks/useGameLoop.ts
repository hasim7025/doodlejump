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
      rotation: 0,
      scale: 1,
      isJumping: false,
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
        rotation: 0,
        scale: 1,
        isJumping: false,
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

    // Draw dynamic background with animated gradient
    const time = Date.now() * 0.001;
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, `hsl(${200 + Math.sin(time) * 10}, 70%, 95%)`);
    gradient.addColorStop(1, `hsl(${220 + Math.sin(time) * 10}, 70%, 90%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background particles
    for (let i = 0; i < 20; i++) {
      const x = (Math.sin(time + i) * 50 + i * 30) % CANVAS_WIDTH;
      const y = (Math.cos(time + i) * 30 + i * 20) % CANVAS_HEIGHT;
      const size = 2 + Math.sin(time + i) * 2;
      ctx.fillStyle = `hsla(${200 + Math.sin(time + i) * 30}, 70%, 50%, 0.1)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw platforms with modern style and glow effect
    platforms.forEach((platform: Platform) => {
      // Platform glow
      const glowGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + 15);
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(platform.x, platform.y - 5, platform.width, 20);
      
      // Platform shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, 15);
      
      // Platform gradient
      const platformGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + 15);
      platformGradient.addColorStop(0, `hsl(${200 + Math.sin(time) * 30}, 70%, 40%)`);
      platformGradient.addColorStop(1, `hsl(${220 + Math.sin(time) * 30}, 70%, 30%)`);
      ctx.fillStyle = platformGradient;
      ctx.fillRect(platform.x, platform.y, platform.width, 15);
    });

    // Draw Pikachu character
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.rotation);
    ctx.scale(player.scale, player.scale);
    
    // Character glow
    const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, player.width);
    playerGlow.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
    playerGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
    ctx.fillStyle = playerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, player.width, 0, Math.PI * 2);
    ctx.fill();
    
    // Character shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 2, player.width / 2, player.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pikachu body
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width / 2, player.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pikachu cheeks
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.ellipse(-player.width/3, -player.height/4, player.width/4, player.height/4, 0, 0, Math.PI * 2);
    ctx.ellipse(player.width/3, -player.height/4, player.width/4, player.height/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pikachu eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(-player.width/4, -player.height/4, player.width/8, player.height/8, 0, 0, Math.PI * 2);
    ctx.ellipse(player.width/4, -player.height/4, player.width/8, player.height/8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pikachu nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(0, -player.height/6, player.width/12, player.height/12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pikachu mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, player.width/3, 0, Math.PI, false);
    ctx.stroke();
    
    // Pikachu ears
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    // Left ear
    ctx.moveTo(-player.width/2, -player.height/2);
    ctx.lineTo(-player.width/2 - 10, -player.height/2 - 20);
    ctx.lineTo(-player.width/2 + 10, -player.height/2 - 10);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(player.width/2, -player.height/2);
    ctx.lineTo(player.width/2 + 10, -player.height/2 - 20);
    ctx.lineTo(player.width/2 - 10, -player.height/2 - 10);
    ctx.closePath();
    ctx.fill();
    
    // Electric effect when jumping
    if (player.isJumping) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-player.width/2, 0);
      ctx.lineTo(-player.width/2 - 15, -10);
      ctx.lineTo(-player.width/2 - 25, -20);
      ctx.stroke();
    }
    
    ctx.restore();

    // Draw score with modern style (no bounce)
    ctx.save();
    ctx.translate(10, 30);
    
    // Score shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = 'bold 24px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(`Score: ${score}`, 2, 2);
    ctx.fillText(`High Score: ${highScore}`, 2, 32);
    
    // Score text with gradient
    const scoreGradient = ctx.createLinearGradient(0, 0, 0, 40);
    scoreGradient.addColorStop(0, `hsl(${200 + Math.sin(time) * 30}, 70%, 40%)`);
    scoreGradient.addColorStop(1, `hsl(${220 + Math.sin(time) * 30}, 70%, 30%)`);
    ctx.fillStyle = scoreGradient;
    ctx.font = 'bold 24px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(`Score: ${score}`, 0, 0);
    ctx.fillText(`High Score: ${highScore}`, 0, 30);
    
    ctx.restore();

    if (gameOver) {
      // Game over overlay with animated gradient
      const overlayGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      overlayGradient.addColorStop(0, `hsla(${200 + Math.sin(time) * 30}, 70%, 30%, 0.9)`);
      overlayGradient.addColorStop(1, `hsla(${220 + Math.sin(time) * 30}, 70%, 20%, 0.9)`);
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Game Over text (no bounce)
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      
      // Text shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.font = 'bold 40px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillText('Game Over!', -110, 2);
      
      // Text with gradient
      const textGradient = ctx.createLinearGradient(-100, -20, 100, 20);
      textGradient.addColorStop(0, '#ffffff');
      textGradient.addColorStop(1, '#e0e0e0');
      ctx.fillStyle = textGradient;
      ctx.font = 'bold 40px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillText('Game Over!', -108, 0);
      
      // Restart text
      ctx.font = '20px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('Press Space to Restart', -100, 40);
      
      ctx.restore();
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