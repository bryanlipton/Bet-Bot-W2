import animalAvatarsImage from '@assets/360_F_91764443_Km6nSUpkR6lo73DBolwLqMeSqmX2hQxs_1752891779225.jpg';

// Clean, modern avatar options with the same color scheme
export const animalAvatars = [
  // Row 1: Friendly characters with pink, blue, green backgrounds
  {
    id: 'alex',
    name: 'Alex',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=alex&backgroundColor=E781A6&hair=shortFlat,shortRound&facialHair=none',
    background: '#E781A6'
  },
  {
    id: 'blake', 
    name: 'Blake',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=blake&backgroundColor=4FB3D9&hair=shortCurly,shortWaved&facialHair=none',
    background: '#4FB3D9'
  },
  {
    id: 'casey',
    name: 'Casey', 
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=casey&backgroundColor=9FD356&hair=longStraight,mediumStraight&facialHair=none',
    background: '#9FD356'
  },
  // Row 2: More characters with yellow, dark blue, coral backgrounds
  {
    id: 'drew',
    name: 'Drew',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=drew&backgroundColor=F7D060&hair=shortSides,shortFlat&facialHair=none',
    background: '#F7D060'
  },
  {
    id: 'emery',
    name: 'Emery',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=emery&backgroundColor=3F5F7F&hair=longCurly,mediumCurly&facialHair=none',
    background: '#3F5F7F'
  },
  {
    id: 'finley',
    name: 'Finley',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=finley&backgroundColor=F56565&hair=shortWaved,shortRound&facialHair=none',
    background: '#F56565'
  },
  // Row 3: Final characters with light blue, orange, teal backgrounds
  {
    id: 'gray',
    name: 'Gray',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=gray&backgroundColor=87CEEB&hair=shortFlat,shortSides&facialHair=none',
    background: '#87CEEB'
  },
  {
    id: 'harper',
    name: 'Harper',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=harper&backgroundColor=FFA500&hair=longStraight,longCurly&facialHair=none',
    background: '#FFA500'
  },
  {
    id: 'indie',
    name: 'Indie',
    url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=indie&backgroundColor=1DD1A1&hair=mediumStraight,mediumCurly&facialHair=none',
    background: '#1DD1A1'
  }
];

// Function to get a random animal avatar
export function getRandomAnimalAvatar(): string {
  const randomIndex = Math.floor(Math.random() * animalAvatars.length);
  return animalAvatars[randomIndex].url;
}

// Function to get avatar URL with fallback (consistent seed for new users)
export function getAvatarUrl(profileImageUrl?: string | null, userId?: string): string {
  if (profileImageUrl && profileImageUrl !== '') {
    // Check if it's one of our animal avatar IDs
    const animalAvatar = animalAvatars.find(avatar => avatar.id === profileImageUrl);
    if (animalAvatar) {
      return animalAvatar.url;
    }
    return profileImageUrl;
  }
  // Use user ID as seed for consistent avatar generation
  if (userId) {
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${userId}&backgroundColor=c0aede`;
  }
  return getRandomAnimalAvatar();
}

// Function to check if avatar is emoji
export function isEmojiAvatar(avatar: string): boolean {
  return /^\p{Emoji}$/u.test(avatar);
}

// Function to get animal avatar by ID
export function getAnimalAvatarById(id: string) {
  return animalAvatars.find(avatar => avatar.id === id);
}