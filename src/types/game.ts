export interface Platform {
  x: number;
  y: number;
  width: number;
}

export interface Player {
  x: number;
  y: number;
  velocityY: number;
  velocityX: number;
  width: number;
  height: number;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  score: number;
  gameOver: boolean;
  highScore: number;
}