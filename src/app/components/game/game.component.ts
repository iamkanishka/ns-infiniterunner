import { Component, OnInit, OnDestroy, HostListener, NO_ERRORS_SCHEMA } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameEngineService } from '../../services/game-engine.service';
import { Dinosaur, Obstacle, GameState } from './game.models';
import { CommonModule } from '@angular/common';
import { NativeScriptCommonModule } from '@nativescript/angular';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  
})
export class GameComponent implements OnInit, OnDestroy {
 dinosaur: Dinosaur | null = null;
  obstacles: Obstacle[] = [];
  gameState: GameState | null = null;

  clouds = Array.from({ length: 5 }, () => ({
    x: Math.random() * 300,
    y: 50 + Math.random() * 150,
    width: 40 + Math.random() * 30,
    height: 20 + Math.random() * 15,
    speed: 0.5 + Math.random() * 0.5,
  }));

  private subscriptions: Subscription[] = [];
  private cloudInterval: any = null; // NativeScript timer

  constructor(private gameEngine: GameEngineService) {}

  ngOnInit(): void {
    console.log('GameComponent initialized');
    
    this.subscriptions.push(
      this.gameEngine.dinosaur$.subscribe((dino) => (this.dinosaur = dino)),
      this.gameEngine.obstacles$.subscribe((obs) => (this.obstacles = obs)),
      this.gameEngine.gameState$.subscribe((state) => (this.gameState = state))
    );

    // Start cloud animation (NativeScript only)
    this.animateClouds();
  }

  startGame(): void {
    this.gameEngine.startGame();
  }

  jump(): void {
    this.gameEngine.jump();
  }

  private animateClouds(): void {
    this.cloudInterval = setInterval(() => {
      this.clouds.forEach((cloud) => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.width < 0) {
          cloud.x = 400;
          cloud.y = 50 + Math.random() * 150;
        }
      });
    }, 16); // ~60fps
  }

  getGameStatusText(): string {
    if (!this.gameState) return 'Ready?';

    if (this.gameState.isGameOver) {
      return `Game Over! Score: ${this.gameState.score}\nHigh Score: ${this.gameState.highScore}\nTap to restart`;
    }

    if (!this.gameState.isRunning) {
      return 'Tap to start\nTap anywhere to jump';
    }

    return `Score: ${this.gameState.score} | High: ${this.gameState.highScore}`;
  }

  getDinosaurRunFrame(): string {
    if (!this.dinosaur) return '0';
    return this.dinosaur.isJumping ? 'jump' : this.dinosaur.runFrame.toString();
  }

  getBirdFlyFrame(obstacle: Obstacle): string {
    return obstacle.flyFrame.toString();
  }

  isBird(obstacle: Obstacle): boolean {
    return obstacle.type === 'bird';
  }

  isCactus(obstacle: Obstacle): boolean {
    return obstacle.type === 'cactus';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.cloudInterval) {
      clearInterval(this.cloudInterval);
    }
  }
}