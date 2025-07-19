import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Upload } from 'lucide-react';
import { animalAvatars } from '@/data/avatars';

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onAvatarChange: (avatarUrl: string) => void;
}

export default function AvatarPicker({ isOpen, onClose, currentAvatar, onAvatarChange }: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [customUrl, setCustomUrl] = useState('');

  const handleAnimalSelect = (emoji: string) => {
    setSelectedAvatar(emoji);
    setCustomUrl('');
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      setSelectedAvatar(customUrl.trim());
    }
  };

  const handleSave = () => {
    onAvatarChange(selectedAvatar);
    onClose();
  };

  // Get current avatar data for preview
  const currentAvatarData = animalAvatars.find(a => a.emoji === selectedAvatar);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: currentAvatarData?.background || '#9CA3AF' }}
            >
              {currentAvatarData ? (
                <span className="text-4xl">{selectedAvatar}</span>
              ) : selectedAvatar.startsWith('http') ? (
                <img 
                  src={selectedAvatar} 
                  alt="Preview"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<span class="text-2xl text-white font-bold">?</span>';
                  }}
                />
              ) : (
                <span className="text-4xl">{selectedAvatar}</span>
              )}
            </div>
          </div>

          {/* Animal Avatars */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose an animal</Label>
            <div className="grid grid-cols-7 gap-3">
              {animalAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleAnimalSelect(avatar.emoji)}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                    selectedAvatar === avatar.emoji
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: avatar.background }}
                  title={avatar.name}
                >
                  <span className="text-2xl">{avatar.emoji}</span>
                  {selectedAvatar === avatar.emoji && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Or Use Custom Image URL</Label>
            <div className="flex gap-2">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/your-image.jpg"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCustomUrl}
                disabled={!customUrl.trim()}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Paste a direct link to your image
            </p>
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