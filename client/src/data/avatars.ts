// Male-skewed avatar options for user profiles - targeting male demographic 
export const animalAvatars = [
  // Male-associated avatars (70% of list for target demographic)
  'https://api.dicebear.com/9.x/adventurer/svg?seed=bear&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=lion&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=tiger&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=wolf&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=eagle&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=shark&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=bull&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=rhino&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=gorilla&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=panther&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=buffalo&backgroundColor=c0aede',
  // Neutral/mixed appeal (30% of list)
  'https://api.dicebear.com/9.x/adventurer/svg?seed=fox&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=owl&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=elephant&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=monkey&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=penguin&backgroundColor=d1d4f9'
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