export interface GameElement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dinosaur extends GameElement {
  isJumping: boolean;
  isRunning: boolean;
  velocity: number;
  gravity: number;
  jumpPower: number;
  runFrame: number;
  maxRunFrames: number;
}

export interface Obstacle extends GameElement {
  type: 'cactus' | 'bird';
  speed: number;
  passed: boolean;
  flyFrame: number;
  maxFlyFrames: number;
}

export interface GameState {
  isRunning: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  speed: number;
}

export interface GameConfig {
  gravity: number;
  jumpPower: number;
  groundLevel: number;
  gameSpeed: number;
  speedIncrement: number;
  runAnimationSpeed: number;
  flyAnimationSpeed: number;
}