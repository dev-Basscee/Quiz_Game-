/**
 * Scoring logic for quiz game
 */

/**
 * Calculate points for a player's answer
 * @param {Object} options - Scoring options
 * @param {boolean} options.isCorrect - Whether the answer is correct
 * @param {number} options.timeTaken - Time taken to answer in ms
 * @param {number} options.timeLimit - Total time limit in ms
 * @param {number} options.basePoints - Base points for correct answer
 * @param {number} options.speedMultiplier - Speed bonus multiplier
 * @param {number} options.streak - Current streak count
 * @param {boolean} options.streakBonus - Whether streak bonus is enabled
 * @returns {Object} Score calculation result
 */
function calculateScore({
  isCorrect,
  timeTaken,
  timeLimit,
  basePoints = 1000,
  speedMultiplier = 0.5,
  streak = 0,
  streakBonus = true,
  isFirstCorrect = false
}) {
  if (!isCorrect) {
    return {
      points: 0,
      breakdown: {
        base: 0,
        speed: 0,
        streak: 0,
        firstBonus: 0,
        total: 0
      }
    };
  }

  // Base points for correct answer
  const base = basePoints;

  // Speed bonus calculation - still provide some speed bonus even with first-to-answer
  const remainingTime = Math.max(0, timeLimit - timeTaken);
  const timeRatio = remainingTime / timeLimit;
  const speedPoints = Math.ceil(timeRatio * basePoints * speedMultiplier);

  // Streak bonus calculation
  const streakPoints = streakBonus && streak > 0 ? streak * 100 : 0;

  // First correct answer bonus - significant bonus for being first
  const firstBonus = isFirstCorrect ? basePoints * 0.5 : 0;

  const total = base + speedPoints + streakPoints + firstBonus;

  return {
    points: total,
    breakdown: {
      base,
      speed: speedPoints,
      streak: streakPoints,
      firstBonus,
      total
    }
  };
}

/**
 * Calculate final scores and rankings for a game
 * @param {Array} players - Array of player objects
 * @returns {Array} Sorted leaderboard with rankings
 */
function calculateLeaderboard(players) {
  return players
    .map(player => ({
      ...player,
      finalScore: player.score
    }))
    .sort((a, b) => {
      // Primary sort: by score (descending)
      if (a.finalScore !== b.finalScore) {
        return b.finalScore - a.finalScore;
      }
      
      // Tie-breaker: by earliest last answer timestamp
      const aTime = a.lastAnswer?.timestamp || Infinity;
      const bTime = b.lastAnswer?.timestamp || Infinity;
      return aTime - bTime;
    })
    .map((player, index) => ({
      ...player,
      rank: index + 1,
      previousRank: player.previousRank || index + 1
    }));
}

/**
 * Get rank change for display purposes
 * @param {number} currentRank - Current rank
 * @param {number} previousRank - Previous rank
 * @returns {Object} Rank change information
 */
function getRankChange(currentRank, previousRank) {
  const change = previousRank - currentRank;
  return {
    change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    magnitude: Math.abs(change)
  };
}

module.exports = {
  calculateScore,
  calculateLeaderboard,
  getRankChange
};