import animalAvatarsImage from '@assets/360_F_91764443_Km6nSUpkR6lo73DBolwLqMeSqmX2hQxs_1752891779225.jpg';

// Simple emoji-based animal avatars with colorful backgrounds
export const animalAvatars = [
  // Row 1
  { id: 'cat', name: 'Cat', emoji: '🐱', background: '#E781A6' },
  { id: 'dog', name: 'Dog', emoji: '🐶', background: '#4FB3D9' },
  { id: 'fox', name: 'Fox', emoji: '🦊', background: '#9FD356' },
  { id: 'bear', name: 'Bear', emoji: '🐻', background: '#F7D060' },
  { id: 'panda', name: 'Panda', emoji: '🐼', background: '#3F5F7F' },
  { id: 'koala', name: 'Koala', emoji: '🐨', background: '#F56565' },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', background: '#87CEEB' },
  
  // Row 2
  { id: 'lion', name: 'Lion', emoji: '🦁', background: '#FFA500' },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', background: '#1DD1A1' },
  { id: 'monkey', name: 'Monkey', emoji: '🐵', background: '#E781A6' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', background: '#4FB3D9' },
  { id: 'hamster', name: 'Hamster', emoji: '🐹', background: '#9FD356' },
  { id: 'mouse', name: 'Mouse', emoji: '🐭', background: '#F7D060' },
  { id: 'pig', name: 'Pig', emoji: '🐷', background: '#3F5F7F' },
  
  // Row 3
  { id: 'frog', name: 'Frog', emoji: '🐸', background: '#F56565' },
  { id: 'chicken', name: 'Chicken', emoji: '🐥', background: '#87CEEB' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', background: '#FFA500' },
  { id: 'owl', name: 'Owl', emoji: '🦉', background: '#1DD1A1' },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', background: '#E781A6' },
  { id: 'dragon', name: 'Dragon', emoji: '🐲', background: '#4FB3D9' },
  { id: 'octopus', name: 'Octopus', emoji: '🐙', background: '#9FD356' }
];

// Function to get a random animal avatar emoji
export function getRandomAnimalAvatar(): string {
  const randomIndex = Math.floor(Math.random() * animalAvatars.length);
  return animalAvatars[randomIndex].emoji;
}

// Function to get avatar with fallback (consistent seed for new users)
export function getAvatarUrl(profileImageUrl?: string | null, userId?: string): string {
  if (profileImageUrl && profileImageUrl !== '') {
    return profileImageUrl;
  }
  // Return random emoji for new users
  return getRandomAnimalAvatar();
}

// Function to check if avatar is emoji
export function isEmojiAvatar(avatar: string): boolean {
  return /^\p{Emoji}$/u.test(avatar);
}

// Function to get animal avatar by emoji
export function getAnimalAvatarByEmoji(emoji: string) {
  return animalAvatars.find(avatar => avatar.emoji === emoji);
}

// Function to get animal avatar by ID
export function getAnimalAvatarById(id: string) {
  return animalAvatars.find(avatar => avatar.id === id);
}