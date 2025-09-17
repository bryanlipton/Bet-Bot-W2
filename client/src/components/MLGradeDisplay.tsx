import React from 'react';

interface MLGradeProps {
  grade: string;
  confidence: number;
  edge: number;
  compact?: boolean;
}

export const MLGradeDisplay: React.FC<MLGradeProps> = ({ grade, confidence, edge, compact = false }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-600 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B+': return 'bg-blue-600 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C+': return 'bg-yellow-600 text-white';
      case 'C': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`px-3 py-1 rounded font-bold ${getGradeColor(grade)}`}>
        {grade}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400">
        {(edge * 100).toFixed(1)}% edge • {(confidence * 100).toFixed(0)}% confidence
      </div>
    </div>
  );
};
