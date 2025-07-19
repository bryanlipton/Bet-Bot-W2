import animalAvatarsImage from '@assets/360_F_91764443_Km6nSUpkR6lo73DBolwLqMeSqmX2hQxs_1752891779225.jpg';

// Animal avatar options with illustrated style matching your design
export const animalAvatars = [
  // Row 1: Cat (pink), Wolf (blue), Panda (green)
  {
    id: 'cat',
    name: 'Cat',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=cat&backgroundColor=E781A6&eyes=variant01&mouth=variant01',
    background: '#E781A6'
  },
  {
    id: 'wolf', 
    name: 'Wolf',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=wolf&backgroundColor=4FB3D9&eyes=variant02&mouth=variant02',
    background: '#4FB3D9'
  },
  {
    id: 'panda',
    name: 'Panda', 
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=panda&backgroundColor=9FD356&eyes=variant03&mouth=variant03',
    background: '#9FD356'
  },
  // Row 2: Bear (yellow), Fox (dark blue), Raccoon (coral)
  {
    id: 'bear',
    name: 'Bear',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=bear&backgroundColor=F7D060&eyes=variant04&mouth=variant04',
    background: '#F7D060'
  },
  {
    id: 'fox',
    name: 'Fox',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=fox&backgroundColor=3F5F7F&eyes=variant05&mouth=variant05',
    background: '#3F5F7F'
  },
  {
    id: 'raccoon',
    name: 'Raccoon',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=raccoon&backgroundColor=F56565&eyes=variant06&mouth=variant06',
    background: '#F56565'
  },
  // Row 3: Monkey (light blue), Koala (orange), Bull (teal)
  {
    id: 'monkey',
    name: 'Monkey',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=monkey&backgroundColor=87CEEB&eyes=variant07&mouth=variant07',
    background: '#87CEEB'
  },
  {
    id: 'koala',
    name: 'Koala',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=koala&backgroundColor=FFA500&eyes=variant08&mouth=variant08',
    background: '#FFA500'
  },
  {
    id: 'bull',
    name: 'Bull',
    url: 'https://api.dicebear.com/9.x/croodles/svg?seed=bull&backgroundColor=1DD1A1&eyes=variant09&mouth=variant09',
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