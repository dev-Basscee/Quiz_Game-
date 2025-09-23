/**
 * Sample quiz data for the quiz game
 */

const sampleQuizzes = [
  {
    id: "general-knowledge-1",
    title: "General Knowledge Quiz",
    description: "Test your general knowledge with these fun questions!",
    questions: [
      {
        id: "gk1-q1",
        type: "multiple-choice",
        text: "What is the capital of France?",
        imageUrl: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctIndex: 2,
        timeLimitSec: 15
      },
      {
        id: "gk1-q2", 
        type: "true-false",
        text: "The Great Wall of China is visible from space.",
        options: ["True", "False"],
        correctIndex: 1,
        timeLimitSec: 10
      },
      {
        id: "gk1-q3",
        type: "multiple-choice",
        text: "Which planet is known as the Red Planet?",
        imageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctIndex: 1,
        timeLimitSec: 15
      },
      {
        id: "gk1-q4",
        type: "multiple-choice",
        text: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        correctIndex: 2,
        timeLimitSec: 20
      },
      {
        id: "gk1-q5",
        type: "short-text",
        text: "What is the largest ocean on Earth?",
        correctText: "Pacific",
        timeLimitSec: 15
      },
      {
        id: "gk1-q6",
        type: "multiple-choice",
        text: "How many continents are there?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
        timeLimitSec: 15
      },
      {
        id: "gk1-q7",
        type: "true-false",
        text: "Bananas are berries.",
        options: ["True", "False"],
        correctIndex: 0,
        timeLimitSec: 10
      },
      {
        id: "gk1-q8",
        type: "multiple-choice",
        text: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Oxygen", "Silver", "Iron"],
        correctIndex: 1,
        timeLimitSec: 15
      },
      {
        id: "gk1-q9",
        type: "multiple-choice",
        text: "In which year did World War II end?",
        options: ["1944", "1945", "1946", "1947"],
        correctIndex: 1,
        timeLimitSec: 20
      },
      {
        id: "gk1-q10",
        type: "short-text",
        text: "What is the smallest country in the world?",
        correctText: "Vatican City",
        timeLimitSec: 20
      }
    ]
  },
  {
    id: "science-quiz-1",
    title: "Science & Nature Quiz",
    description: "Explore the wonders of science and nature!",
    questions: [
      {
        id: "sci1-q1",
        type: "multiple-choice",
        text: "What is the speed of light in a vacuum?",
        options: ["299,792,458 m/s", "300,000,000 m/s", "3 × 10⁸ m/s", "All of the above"],
        correctIndex: 3,
        timeLimitSec: 25
      },
      {
        id: "sci1-q2",
        type: "true-false",
        text: "Sound travels faster in water than in air.",
        options: ["True", "False"],
        correctIndex: 0,
        timeLimitSec: 15
      },
      {
        id: "sci1-q3",
        type: "multiple-choice",
        text: "Which gas makes up most of Earth's atmosphere?",
        imageUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
        correctIndex: 2,
        timeLimitSec: 20
      },
      {
        id: "sci1-q4",
        type: "short-text",
        text: "What is the powerhouse of the cell?",
        correctText: "Mitochondria",
        timeLimitSec: 15
      },
      {
        id: "sci1-q5",
        type: "multiple-choice",
        text: "How many bones are in an adult human body?",
        options: ["206", "210", "195", "220"],
        correctIndex: 0,
        timeLimitSec: 20
      },
      {
        id: "sci1-q6",
        type: "true-false",
        text: "Diamonds are made of carbon.",
        options: ["True", "False"],
        correctIndex: 0,
        timeLimitSec: 15
      },
      {
        id: "sci1-q7",
        type: "multiple-choice",
        text: "What is the largest mammal in the world?",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
        options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
        correctIndex: 1,
        timeLimitSec: 15
      },
      {
        id: "sci1-q8",
        type: "multiple-choice",
        text: "What type of animal is a Komodo dragon?",
        options: ["Snake", "Lizard", "Crocodile", "Turtle"],
        correctIndex: 1,
        timeLimitSec: 15
      },
      {
        id: "sci1-q9",
        type: "short-text",
        text: "What is the chemical formula for water?",
        correctText: "H2O",
        timeLimitSec: 10
      },
      {
        id: "sci1-q10",
        type: "multiple-choice",
        text: "Which planet has the most moons?",
        options: ["Jupiter", "Saturn", "Neptune", "Uranus"],
        correctIndex: 1,
        timeLimitSec: 20
      }
    ]
  }
];

module.exports = sampleQuizzes;