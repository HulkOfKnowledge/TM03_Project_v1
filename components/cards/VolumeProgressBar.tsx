/**
 * Volume Progress Bar Component
 * Visual indicator for credit utilization levels
 */

'use client';

interface VolumeProgressBarProps {
  zone: 'Safe' | 'Caution' | 'Danger';
}

export function VolumeProgressBar({ zone }: VolumeProgressBarProps) {
  const getBarConfig = () => {
    switch (zone) {
      case 'Safe':
        return { width: '33%', color: 'bg-gray-500', label: 'Safe Zone (0-30%)' };
      case 'Caution':
        return { width: '66%', color: 'bg-yellow-500', label: 'Caution Zone (31-70%)' };
      case 'Danger':
        return { width: '100%', color: 'bg-red-500', label: 'Danger Zone (71-100%)' };
    }
  };

  const config = getBarConfig();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div
          className={`h-full transition-all duration-500 ${config.color}`}
          style={{ width: config.width }}
        />
      </div>
    </div>
  );
}
