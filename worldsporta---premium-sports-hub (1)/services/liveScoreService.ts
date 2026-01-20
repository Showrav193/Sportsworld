
import { MatchScore } from '../types';

/**
 * In a real-world scenario, this would be a WebSocket client:
 * const socket = new WebSocket('wss://api.worldsporta.com/live');
 * 
 * Or an EventSource (SSE):
 * const eventSource = new EventSource('/api/scores/stream');
 */

// Define an interface for the match updates including potential increments for the simulation
export interface MatchUpdate extends Partial<MatchScore> {
  id: string;
  minuteIncrement?: number;
  scoreAIncrement?: number;
  scoreBIncrement?: number;
}

type Listener = (updatedMatch: MatchUpdate) => void;
const listeners: Set<Listener> = new Set();

// Fixed: subscribeToLiveScores now returns a function that specifically returns void
export const subscribeToLiveScores = (callback: Listener) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

// Simulation Engine
let tick = 0;
setInterval(() => {
  tick++;
  
  // Every interval, we potentially update a "Live" match
  listeners.forEach(callback => {
    // Simulate time progression and random events
    // This logic mimics the data coming from a server-side pusher
    
    // We'll target match IDs from INITIAL_SCORES for simulation
    const liveMatchIds = ['s1', 's10', 's11'];
    const randomMatchId = liveMatchIds[Math.floor(Math.random() * liveMatchIds.length)];
    
    const isGoal = Math.random() > 0.95; // 5% chance of a score change per tick
    const isTimeTick = tick % 6 === 0; // Tick the minute every ~30 real seconds if interval is 5s
    
    if (isGoal || isTimeTick) {
      const update: MatchUpdate = { id: randomMatchId };
      
      if (isTimeTick) {
        update.minuteIncrement = 1;
      }
      
      if (isGoal) {
        const team = Math.random() > 0.5 ? 'A' : 'B';
        if (team === 'A') {
          update.scoreAIncrement = 1;
        } else {
          update.scoreBIncrement = 1;
        }
        update.lastEvent = `GOAL! Team ${team} Scores`;
      }

      callback(update);
    }
  });
}, 5000); // 5-second polling/heartbeat simulation
