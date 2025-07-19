// Cute animal avatar options matching the exact design provided
export const animalAvatars = [
  // Row 1: Cat (pink), Wolf (blue), Panda (green)
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=cat&backgroundColor=E781A6&colorful=1',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=wolf&backgroundColor=4FB3D9&colorful=1',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=panda&backgroundColor=9FD356&colorful=1',
  // Row 2: Bear (yellow), Fox (dark blue), Raccoon (coral)
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=bear&backgroundColor=F7D060&colorful=1',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=fox&backgroundColor=3F5F7F&colorful=1',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=raccoon&backgroundColor=F56565&colorful=1',
  // Row 3: Monkey (light blue), Koala (orange), Bull (teal)
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=monkey&backgroundColor=87CEEB&colorful=1',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=koala&backgroundColor=FFA500&colorful=1',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=bull&backgroundColor=1DD1A1&colorful=1'
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