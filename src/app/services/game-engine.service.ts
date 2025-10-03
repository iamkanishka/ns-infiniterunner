import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { Dinosaur, Obstacle, GameState, GameConfig } from '../components/game/game.models';

@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  private gameLoop$: Subscription | null = null;
  private animationFrame: number = 0;
  
  // Game configuration
  private config: GameConfig = {
    gravity: 0.8,
    jumpPower: -15,
    groundLevel: 300,
    gameSpeed: 10,
    speedIncrement: 0.001,
    runAnimationSpeed: 5, // frames per animation update
    flyAnimationSpeed: 3
  };

  // Game state
  private state: GameState = {
    isRunning: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
    speed: this.config.gameSpeed
  };

  // Game elements
  private dinosaur: Dinosaur = {
    x: 80,
    y: this.config.groundLevel,
    width: 44,
    height: 47,
    isJumping: false,
    isRunning: false,
    velocity: 0,
    gravity: this.config.gravity,
    jumpPower: this.config.jumpPower,
    runFrame: 0,
    maxRunFrames: 6 // 6 running frames for animation
  };

  private obstacles: Obstacle[] = [];
  private obstacleTimer: number = 0;
  private obstacleFrequency: number = 120;

  // Observables
  public dinosaur$ = new BehaviorSubject<Dinosaur>(this.dinosaur);
  public obstacles$ = new BehaviorSubject<Obstacle[]>(this.obstacles);
  public gameState$ = new BehaviorSubject<GameState>(this.state);

  constructor() {}

  startGame(): void {
    this.resetGame();
    this.state.isRunning = true;
    this.state.isGameOver = false;
    this.dinosaur.isRunning = true;
    this.updateGameState();

    this.gameLoop$ = interval(16).subscribe(() => {
      if (this.state.isRunning && !this.state.isGameOver) {
        this.animationFrame++;
        this.updateGame();
      }
    });
  }

  private updateGame(): void {
    this.updateDinosaur();
    this.updateObstacles();
    this.updateScore();
    this.checkCollisions();
    this.increaseDifficulty();
    
    this.dinosaur$.next({ ...this.dinosaur });
    this.obstacles$.next([...this.obstacles]);
    this.updateGameState();
  }

  private updateDinosaur(): void {
    // Update running animation
    if (this.dinosaur.isRunning && !this.dinosaur.isJumping) {
      if (this.animationFrame % this.config.runAnimationSpeed === 0) {
        this.dinosaur.runFrame = (this.dinosaur.runFrame + 1) % this.dinosaur.maxRunFrames;
      }
    }

    // Update jumping physics
    if (this.dinosaur.isJumping) {
      this.dinosaur.velocity += this.dinosaur.gravity;
      this.dinosaur.y += this.dinosaur.velocity;

      // Hit the ground
      if (this.dinosaur.y >= this.config.groundLevel) {
        this.dinosaur.y = this.config.groundLevel;
        this.dinosaur.isJumping = false;
        this.dinosaur.velocity = 0;
        this.dinosaur.runFrame = 0; // Reset to first running frame
      }
    }
  }

  private updateObstacles(): void {
    // Generate new obstacles
    this.obstacleTimer++;
    if (this.obstacleTimer >= this.obstacleFrequency) {
      this.generateObstacle();
      this.obstacleTimer = 0;
      this.obstacleFrequency = Math.max(60, 120 - Math.floor(this.state.score / 100) * 10);
    }

    // Move and update obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.x -= this.state.speed;

      // Update bird flying animation
      if (obstacle.type === 'bird') {
        if (this.animationFrame % this.config.flyAnimationSpeed === 0) {
          obstacle.flyFrame = (obstacle.flyFrame + 1) % obstacle.maxFlyFrames;
        }
        
        // Make birds bob up and down slightly
        const bobOffset = Math.sin(this.animationFrame * 0.1) * 5;
        obstacle.y = (this.config.groundLevel - 30) + bobOffset;
      }

      // Mark as passed for scoring
      if (!obstacle.passed && obstacle.x + obstacle.width < this.dinosaur.x) {
        obstacle.passed = true;
      }
    });

    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
  }

  private generateObstacle(): void {
    const types: ('cactus' | 'bird')[] = ['cactus', 'bird'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const obstacle: Obstacle = {
      type,
      x: 400,
      y: type === 'bird' ? this.config.groundLevel - 30 : this.config.groundLevel,
      width: type === 'cactus' ? 20 : 45,
      height: type === 'cactus' ? 40 : 30,
      speed: this.state.speed,
      passed: false,
      flyFrame: 0,
      maxFlyFrames: type === 'bird' ? 4 : 1 // Birds have 4 flying frames
    };

    this.obstacles.push(obstacle);
  }

  private updateScore(): void {
    this.state.score += 1;
  }

  private checkCollisions(): void {
    const dino = this.dinosaur;
    
    for (const obstacle of this.obstacles) {
      if (this.isColliding(dino, obstacle)) {
        this.gameOver();
        return;
      }
    }
  }

  private isColliding(a: any, b: any): boolean {
    // Add a small collision buffer for better gameplay
    const buffer = 5;
    return a.x + buffer < b.x + b.width - buffer &&
           a.x + a.width - buffer > b.x + buffer &&
           a.y + buffer < b.y + b.height - buffer &&
           a.y + a.height - buffer > b.y + buffer;
  }

  private increaseDifficulty(): void {
    this.state.speed = this.config.gameSpeed + (this.state.score * this.config.speedIncrement);
  }

  jump(): void {
    if (!this.dinosaur.isJumping && this.state.isRunning && !this.state.isGameOver) {
      this.dinosaur.isJumping = true;
      this.dinosaur.velocity = this.dinosaur.jumpPower;
      this.dinosaur.runFrame = 0; // Reset animation when jumping
    }
  }

  private gameOver(): void {
    this.state.isRunning = false;
    this.state.isGameOver = true;
    this.dinosaur.isRunning = false;
    
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }
    
    this.updateGameState();
    
    if (this.gameLoop$) {
      this.gameLoop$.unsubscribe();
    }
  }

  private resetGame(): void {
    this.dinosaur = {
      x: 80,
      y: this.config.groundLevel,
      width: 44,
      height: 47,
      isJumping: false,
      isRunning: false,
      velocity: 0,
      gravity: this.config.gravity,
      jumpPower: this.config.jumpPower,
      runFrame: 0,
      maxRunFrames: 6
    };

    this.obstacles = [];
    this.obstacleTimer = 0;
    this.animationFrame = 0;
    this.state.score = 0;
    this.state.speed = this.config.gameSpeed;
  }

  private updateGameState(): void {
    this.gameState$.next({ ...this.state });
  }

  ngOnDestroy(): void {
    if (this.gameLoop$) {
      this.gameLoop$.unsubscribe();
    }
  }
}