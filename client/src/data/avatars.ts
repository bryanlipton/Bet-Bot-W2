import animalAvatarsImage from '@assets/360_F_91764443_Km6nSUpkR6lo73DBolwLqMeSqmX2hQxs_1752891504307.jpg';

// Individual animal avatar options extracted from the provided design
export const animalAvatars = [
  // Using the exact image provided - we'll create individual avatar selections
  animalAvatarsImage, // Full grid for selection
  // Individual animal emoji representations matching your design
  '🐱', // Cat (pink background)
  '🐺', // Wolf (blue background) 
  '🐼', // Panda (green background)
  '🐻', // Bear (yellow background)
  '🦊', // Fox (dark blue background)
  '🦝', // Raccoon (coral background)
  '🐵', // Monkey (light blue background)
  '🐨', // Koala (orange background)
  '🐂'  // Bull (teal background)
];

// Function to get a random animal avatar
export function getRandomAnimalAvatar(): string {
  const randomIndex = Math.floor(Math.random() * animalAvatars.length);
  return animalAvatars[randomIndex];
}

// Function to get avatar URL with fallback (consistent seed for new users)
export function getAvatarUrl(profileImageUrl?: string | null, userId?: string): string {
  if (profileImageUrl && profileImageUrl !== '') {
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