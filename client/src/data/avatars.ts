// Animal avatar options for user profiles - using different avatar style
export const animalAvatars = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=bear&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=fox&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=owl&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=cat&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=dog&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=rabbit&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=penguin&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=panda&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=lion&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=tiger&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=elephant&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=koala&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=monkey&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=deer&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=wolf&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=sheep&backgroundColor=ffd5dc'
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