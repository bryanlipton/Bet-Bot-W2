import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SPORTS_ICONS } from '@/assets/sports-icons';
import baseballImage from "@assets/image_1752879761087.jpg";

interface ProfileImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  onImageSelect: (imageUrl: string) => void;
  username: string;
}

// Sports-themed default profile images
const SPORTS_IMAGES = [
  {
    id: 'baseball',
    name: 'Baseball',
    url: baseballImage
  },
  {
    id: 'football',
    name: 'Football',
    url: SPORTS_ICONS.football
  },
  {
    id: 'basketball',
    name: 'Basketball',
    url: SPORTS_ICONS.basketball
  },
  {
    id: 'soccer',
    name: 'Soccer',
    url: SPORTS_ICONS.soccer
  },
  {
    id: 'tennis',
    name: 'Tennis',
    url: SPORTS_ICONS.tennis
  },
  {
    id: 'hockey',
    name: 'Hockey',
    url: SPORTS_ICONS.hockey
  },
  {
    id: 'golf',
    name: 'Golf',
    url: SPORTS_ICONS.golf
  }
];

export function ProfileImagePicker({ isOpen, onClose, currentImage, onImageSelect, username }: ProfileImagePickerProps) {
  const [selectedImage, setSelectedImage] = useState(currentImage || '');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB.');
        return;
      }

      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      setSelectedImage(imageUrl);
    }
  };

  const handleSportsImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setUploadedImage('');
  };

  const handleSave = () => {
    onImageSelect(selectedImage);
    onClose();
  };

  const handleCancel = () => {
    setSelectedImage(currentImage || '');
    setUploadedImage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Selection Preview */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-2">
                <AvatarImage src={selectedImage} alt="Preview" />
                <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-gray-600 dark:text-gray-400">Preview</p>
            </div>
          </div>

          {/* Upload Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Upload Custom Image</h3>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choose Image File
                </Button>
                <p className="text-xs text-gray-500">
                  Supports JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sports Images */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Sports Themes</h3>
              <div className="grid grid-cols-3 gap-4">
                {SPORTS_IMAGES.map((sport) => (
                  <div
                    key={sport.id}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:border-blue-500 ${
                      selectedImage === sport.url ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleSportsImageSelect(sport.url)}
                  >
                    <Avatar className="w-16 h-16 mx-auto mb-2">
                      <AvatarImage src={sport.url} alt={sport.name} />
                      <AvatarFallback>{sport.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">{sport.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}