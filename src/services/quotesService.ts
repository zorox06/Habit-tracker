export interface Quote {
  text: string;
  author: string;
}

export const stoicQuotes: Quote[] = [
  {
    text: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius"
  },
  {
    text: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius"
  },
  {
    text: "It is not death that a man should fear, but he should fear never beginning to live.",
    author: "Marcus Aurelius"
  },
  {
    text: "Accept the things to which fate binds you, and love the people with whom fate brings you together.",
    author: "Marcus Aurelius"
  },
  {
    text: "The best revenge is not to be like your enemy.",
    author: "Marcus Aurelius"
  },
  {
    text: "Choose not to be harmed — and you won't feel harmed. Don't feel harmed — and you haven't been.",
    author: "Marcus Aurelius"
  },
  {
    text: "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.",
    author: "Marcus Aurelius"
  },
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius"
  },
  {
    text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.",
    author: "Marcus Aurelius"
  },
  {
    text: "The soul becomes dyed with the color of its thoughts.",
    author: "Marcus Aurelius"
  },
  {
    text: "He who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche"
  },
  {
    text: "The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.",
    author: "Albert Camus"
  },
  {
    text: "In the midst of chaos, there is also opportunity.",
    author: "Sun Tzu"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha"
  },
  {
    text: "Happiness is not something ready-made. It comes from your own actions.",
    author: "Dalai Lama"
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela"
  },
  {
    text: "Life is 10% what happens to you and 90% how you react to it.",
    author: "Charles R. Swindoll"
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  },
  {
    text: "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.",
    author: "Joyce Meyer"
  },
  {
    text: "The more you practice, the better you get. The better you get, the more you like it. The more you like it, the more you do it.",
    author: "Althea Gibson"
  },
  {
    text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.",
    author: "Aristotle"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Success is walking from failure to failure with no loss of enthusiasm.",
    author: "Winston Churchill"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  }
];

export const getDailyQuote = (): Quote => {
  const today = new Date();
  const startDate = new Date('2024-01-01'); // Use a fixed start date
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const quoteIndex = daysSinceStart % stoicQuotes.length;
  return stoicQuotes[quoteIndex];
};
