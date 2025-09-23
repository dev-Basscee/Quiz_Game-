/**
 * Player model
 */
class Player {
  constructor({ 
    id, 
    nickname, 
    socketId, 
    avatar = null 
  }) {
    this.id = id;
    this.nickname = nickname;
    this.socketId = socketId;
    this.avatar = avatar;
    this.score = 0;
    this.streak = 0;
    this.lastAnswer = null;
    this.connected = true;
    this.joinedAt = new Date();
  }

  updateScore(points) {
    this.score += points;
  }

  updateStreak(isCorrect) {
    if (isCorrect) {
      this.streak++;
    } else {
      this.streak = 0;
    }
  }

  disconnect() {
    this.connected = false;
  }

  reconnect(socketId) {
    this.socketId = socketId;
    this.connected = true;
  }

  toPublicInfo() {
    return {
      id: this.id,
      nickname: this.nickname,
      avatar: this.avatar,
      score: this.score,
      connected: this.connected
    };
  }
}

module.exports = Player;