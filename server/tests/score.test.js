const { calculateScore, calculateLeaderboard, getRankChange } = require('../lib/score');

describe('Score calculation', () => {
  test('should return 0 points for incorrect answer', () => {
    const result = calculateScore({
      isCorrect: false,
      timeTaken: 5000,
      timeLimit: 10000,
      basePoints: 1000,
      speedMultiplier: 0.5
    });

    expect(result.points).toBe(0);
    expect(result.breakdown.total).toBe(0);
  });

  test('should calculate correct points for fast correct answer', () => {
    const result = calculateScore({
      isCorrect: true,
      timeTaken: 2000, // 2 seconds
      timeLimit: 10000, // 10 seconds total
      basePoints: 1000,
      speedMultiplier: 0.5,
      streak: 0,
      streakBonus: false
    });

    // Base: 1000, Speed: (8000/10000) * 1000 * 0.5 = 400
    expect(result.points).toBe(1400);
    expect(result.breakdown.base).toBe(1000);
    expect(result.breakdown.speed).toBe(400);
    expect(result.breakdown.streak).toBe(0);
  });

  test('should add streak bonus when enabled', () => {
    const result = calculateScore({
      isCorrect: true,
      timeTaken: 5000,
      timeLimit: 10000,
      basePoints: 1000,
      speedMultiplier: 0.5,
      streak: 3,
      streakBonus: true
    });

    // Streak bonus: 3 * 100 = 300
    expect(result.breakdown.streak).toBe(300);
    expect(result.points).toBeGreaterThan(1000);
  });

  test('should handle edge case of maximum time taken', () => {
    const result = calculateScore({
      isCorrect: true,
      timeTaken: 10000, // Full time used
      timeLimit: 10000,
      basePoints: 1000,
      speedMultiplier: 0.5
    });

    // Should get base points only, no speed bonus
    expect(result.points).toBe(1000);
    expect(result.breakdown.speed).toBe(0);
  });
});

describe('Leaderboard calculation', () => {
  test('should sort players by score descending', () => {
    const players = [
      { id: '1', nickname: 'Player1', score: 1500 },
      { id: '2', nickname: 'Player2', score: 2000 },
      { id: '3', nickname: 'Player3', score: 1000 }
    ];

    const leaderboard = calculateLeaderboard(players);

    expect(leaderboard[0].score).toBe(2000);
    expect(leaderboard[1].score).toBe(1500);
    expect(leaderboard[2].score).toBe(1000);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].rank).toBe(2);
    expect(leaderboard[2].rank).toBe(3);
  });

  test('should handle tie-breaking by timestamp', () => {
    const players = [
      { 
        id: '1', 
        nickname: 'Player1', 
        score: 1000,
        lastAnswer: { timestamp: 1000 }
      },
      { 
        id: '2', 
        nickname: 'Player2', 
        score: 1000,
        lastAnswer: { timestamp: 500 }
      }
    ];

    const leaderboard = calculateLeaderboard(players);

    // Player2 should rank higher due to earlier timestamp
    expect(leaderboard[0].nickname).toBe('Player2');
    expect(leaderboard[1].nickname).toBe('Player1');
  });
});

describe('Rank change calculation', () => {
  test('should detect rank improvement', () => {
    const change = getRankChange(2, 5);
    
    expect(change.change).toBe(3);
    expect(change.direction).toBe('up');
    expect(change.magnitude).toBe(3);
  });

  test('should detect rank decline', () => {
    const change = getRankChange(5, 2);
    
    expect(change.change).toBe(-3);
    expect(change.direction).toBe('down');
    expect(change.magnitude).toBe(3);
  });

  test('should detect no rank change', () => {
    const change = getRankChange(3, 3);
    
    expect(change.change).toBe(0);
    expect(change.direction).toBe('same');
    expect(change.magnitude).toBe(0);
  });
});