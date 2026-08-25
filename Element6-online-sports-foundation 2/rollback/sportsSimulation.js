import { decodeInput } from '../rollback/inputBits.js';

const WIDTH = 960, HEIGHT = 540;
const settingsFor = mode => ({ goal: mode.includes('soccer') ? 5 : mode.includes('volleyball') ? 15 : mode.includes('dodgeball') ? 10 : 12, sport: mode.split('_')[0] });
export function createOnlineSportState({ mode, players }) {
  const cfg = settingsFor(mode);
  return { frame: 0, mode, sport: cfg.sport, goal: cfg.goal, score: [0, 0], serveTeam: 1, ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 3, vy: -2 }, players: players.map((p, i) => ({ id: p.user_id, team: p.team, char: p.character_id, x: p.team === 1 ? 190 + (i % 3) * 85 : 770 - (i % 3) * 85, y: 370, vx: 0, vy: 0, cooldown: 0 })), winnerTeam: null };
}
export function stepOnlineSport(state, inputMasks) {
  const next = structuredClone(state); const ball = next.ball;
  for (const player of next.players) {
    const input = decodeInput(inputMasks[player.id] || 0); const ax = (input.right ? 0.42 : 0) - (input.left ? 0.42 : 0);
    player.vx = Math.max(-5, Math.min(5, (player.vx + ax) * 0.82)); player.x = Math.max(20, Math.min(WIDTH - 20, player.x + player.vx));
    if (input.jump && player.y >= 370) player.vy = -8; player.vy += 0.42; player.y = Math.min(370, player.y + player.vy); if (player.y >= 370) player.vy = 0;
    player.cooldown = Math.max(0, player.cooldown - 1);
    const close = Math.hypot(player.x - ball.x, player.y - ball.y) < 46;
    if (close && player.cooldown === 0 && (input.sig || input.heavy || input.power)) { const dir = player.team === 1 ? 1 : -1; ball.vx = dir * (input.heavy ? 8 : input.power ? 10 : 6); ball.vy = input.jump ? -6 : -3; player.cooldown = 20; }
  }
  ball.vy += 0.18; ball.x += ball.vx; ball.y += ball.vy;
  if (ball.y < 18 || ball.y > 430) ball.vy *= -0.82;
  if (ball.x < 0 || ball.x > WIDTH) { const scoring = ball.x < 0 ? 2 : 1; next.score[scoring - 1] += 1; next.serveTeam = scoring; ball.x = WIDTH / 2; ball.y = HEIGHT / 2; ball.vx = scoring === 1 ? 3 : -3; ball.vy = -2; }
  if (next.sport === 'volleyball' && Math.abs(ball.x - WIDTH / 2) < 8 && ball.y > 210) ball.vx *= -1;
  if (next.score[0] >= next.goal || next.score[1] >= next.goal) next.winnerTeam = next.score[0] > next.score[1] ? 1 : 2;
  next.frame += 1; return next;
}
export { WIDTH, HEIGHT };
