import { Game } from './core/Game';

function initGame(): void {
  const game = new Game();
  game.start().catch((err) => {
    console.error('Failed to start Alpine Freeride simulation:', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
