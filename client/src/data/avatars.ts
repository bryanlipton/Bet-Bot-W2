// Cute animal avatar options based on the provided design
export const animalAvatars = [
  // Fun emoji-style animal avatars with cute designs similar to your provided image
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=cat&backgroundColor=E78B9C',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=wolf&backgroundColor=4FACFF', 
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=panda&backgroundColor=9BD723',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=bear&backgroundColor=FFDA44',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=fox&backgroundColor=37495A',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=raccoon&backgroundColor=FF5A42',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=monkey&backgroundColor=4FACFF',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=koala&backgroundColor=FFA726',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=bull&backgroundColor=1CBE76'
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