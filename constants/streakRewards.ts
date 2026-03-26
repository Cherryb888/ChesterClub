// ─── Streak Milestone Rewards ───
//
// Defines rewards triggered at specific streak lengths.
// Checked in feedChester() after streak increment.

export interface StreakMilestone {
  day: number;
  coins: number;
  shopUnlock?: string; // shop item ID unlocked at this milestone
  chesterMessage: string;
  animation: 'confetti' | 'fireworks' | 'goldenGlow';
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    day: 3,
    coins: 15,
    chesterMessage: "3 days in a row! Chester's tail hasn't stopped wagging!",
    animation: 'confetti',
  },
  {
    day: 7,
    coins: 30,
    chesterMessage: "A full week! Chester's doing zoomies around the house!",
    animation: 'confetti',
  },
  {
    day: 14,
    coins: 60,
    chesterMessage: "Two weeks strong! Chester's never been prouder of you!",
    animation: 'fireworks',
  },
  {
    day: 21,
    coins: 80,
    chesterMessage: "21 days — it's officially a habit! Chester's beaming!",
    animation: 'fireworks',
  },
  {
    day: 30,
    coins: 150,
    shopUnlock: 'hat_crown',
    chesterMessage: "ONE MONTH! Chester's wearing his crown today! You earned it!",
    animation: 'goldenGlow',
  },
  {
    day: 60,
    coins: 300,
    shopUnlock: 'acc_cape',
    chesterMessage: "60 DAYS! Chester's a superhero and so are you! Cape unlocked!",
    animation: 'goldenGlow',
  },
  {
    day: 90,
    coins: 500,
    shopUnlock: 'title_legend',
    chesterMessage: "90 DAYS! You're a Living Legend! Chester can't even bark — he's speechless!",
    animation: 'goldenGlow',
  },
];

export function getMilestoneForDay(day: number): StreakMilestone | undefined {
  return STREAK_MILESTONES.find(m => m.day === day);
}
