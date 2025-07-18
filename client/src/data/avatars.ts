// Animal avatar options for user profiles - using actual animal avatar URLs
export const animalAvatars = [
  'https://api.dicebear.com/7.x/animals/svg?seed=bear&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/animals/svg?seed=fox&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/animals/svg?seed=owl&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/animals/svg?seed=cat&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/animals/svg?seed=dog&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/animals/svg?seed=rabbit&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/animals/svg?seed=penguin&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/animals/svg?seed=panda&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/animals/svg?seed=lion&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/animals/svg?seed=tiger&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/animals/svg?seed=elephant&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/animals/svg?seed=koala&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/animals/svg?seed=monkey&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/animals/svg?seed=deer&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/animals/svg?seed=wolf&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/animals/svg?seed=sheep&backgroundColor=ffd5dc'
];

// Function to get a random animal avatar
export function getRandomAnimalAvatar(): string {
  const randomIndex = Math.floor(Math.random() * animalAvatars.length);
  return animalAvatars[randomIndex];
}

// Function to get avatar URL with fallback
export function getAvatarUrl(profileImageUrl?: string | null): string {
  if (profileImageUrl && profileImageUrl !== '') {
    return profileImageUrl;
  }
  return getRandomAnimalAvatar();
}