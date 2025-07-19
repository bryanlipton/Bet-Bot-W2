import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onAvatarChange: (avatarUrl: string) => void;
}

const ANIMALS = [
  { emoji: '🐱', name: 'Cat' },
  { emoji: '🐶', name: 'Dog' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🐻', name: 'Bear' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🐨', name: 'Koala' },
  { emoji: '🐯', name: 'Tiger' },
  { emoji: '🦁', name: 'Lion' },
  { emoji: '🐺', name: 'Wolf' },
  { emoji: '🐵', name: 'Monkey' },
  { emoji: '🐰', name: 'Rabbit' },
  { emoji: '🐹', name: 'Hamster' },
  { emoji: '🐭', name: 'Mouse' },
  { emoji: '🐷', name: 'Pig' },
  { emoji: '🐸', name: 'Frog' },
  { emoji: '🐥', name: 'Chicken' },
  { emoji: '🐧', name: 'Penguin' },
  { emoji: '🦉', name: 'Owl' },
  { emoji: '🦄', name: 'Unicorn' },
  { emoji: '🐲', name: 'Dragon' },
  { emoji: '🐙', name: 'Octopus' },
  { emoji: '🦅', name: 'Eagle' },
  { emoji: '🐢', name: 'Turtle' },
  { emoji: '🦋', name: 'Butterfly' },
  { emoji: '🐝', name: 'Bee' },
  { emoji: '🦈', name: 'Shark' },
  { emoji: '🐬', name: 'Dolphin' },
  { emoji: '🦕', name: 'Dinosaur' },
];

const BACKGROUND_COLORS = [
  { name: 'Pink', class: 'bg-pink-200 dark:bg-pink-300' },
  { name: 'Red', class: 'bg-red-200 dark:bg-red-300' },
  { name: 'Orange', class: 'bg-orange-200 dark:bg-orange-300' },
  { name: 'Yellow', class: 'bg-yellow-200 dark:bg-yellow-300' },
  { name: 'Green', class: 'bg-green-200 dark:bg-green-300' },
  { name: 'Blue', class: 'bg-blue-200 dark:bg-blue-300' },
  { name: 'Purple', class: 'bg-purple-200 dark:bg-purple-300' },
  { name: 'Gray', class: 'bg-gray-200 dark:bg-gray-300' },
];

export default function AvatarPicker({ isOpen, onClose, currentAvatar, onAvatarChange }: AvatarPickerProps) {
  // Parse current avatar (emoji|background format) or default to first options
  const currentAvatarData = currentAvatar?.includes('|') ? {
    animal: currentAvatar.split('|')[0],
    background: currentAvatar.split('|')[1]
  } : { 
    animal: currentAvatar || ANIMALS[0].emoji, 
    background: BACKGROUND_COLORS[0].class 
  };

  const [selectedAnimal, setSelectedAnimal] = useState(currentAvatarData.animal);
  const [selectedBackground, setSelectedBackground] = useState(currentAvatarData.background);

  const handleAnimalSelect = (emoji: string) => {
    setSelectedAnimal(emoji);
  };

  const handleBackgroundSelect = (bgClass: string) => {
    setSelectedBackground(bgClass);
  };

  const handleSave = () => {
    const avatarData = `${selectedAnimal}|${selectedBackground}`;
    onAvatarChange(avatarData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 ${selectedBackground}`}>
              <span className="text-6xl">{selectedAnimal}</span>
            </div>
          </div>

          {/* Animal Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose Animal</Label>
            <div className="grid grid-cols-6 gap-3">
              {ANIMALS.map((animal) => (
                <button
                  key={animal.emoji}
                  type="button"
                  onClick={() => handleAnimalSelect(animal.emoji)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl hover:scale-110 transition-transform border-2 bg-gray-100 dark:bg-gray-700 ${
                    selectedAnimal === animal.emoji
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={animal.name}
                >
                  {animal.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose Background Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_COLORS.map((bg) => (
                <button
                  key={bg.name}
                  type="button"
                  onClick={() => handleBackgroundSelect(bg.class)}
                  className={`w-20 h-16 rounded-lg flex items-center justify-center text-sm font-medium transition-transform hover:scale-105 border-2 ${bg.class} ${
                    selectedBackground === bg.class
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={bg.name}
                >
                  {bg.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}