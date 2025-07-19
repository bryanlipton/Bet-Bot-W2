import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Check } from 'lucide-react';
import { animalAvatars } from '@/data/avatars';

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentAvatar: string;
}

export default function AvatarPicker({ isOpen, onClose, onSelect, currentAvatar }: AvatarPickerProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleAnimalSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      setSelectedAvatar(customUrl.trim());
      setCustomUrl('');
    }
  };

  const handleSave = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
              <img 
                src={selectedAvatar} 
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-full flex items-center justify-center bg-blue-600 text-white text-2xl font-bold">
                U
              </div>
            </div>
          </div>

          {/* Animal Avatars */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Choose a character</Label>
            <div className="grid grid-cols-3 gap-4">
              {animalAvatars.map((avatar, index) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAnimalSelect(avatar.id)}
                  className={`relative w-16 h-16 rounded-full border-2 transition-all hover:scale-105 overflow-hidden ${
                    selectedAvatar === avatar.id 
                      ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: avatar.background }}
                >
                  <img 
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatar.id && (
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