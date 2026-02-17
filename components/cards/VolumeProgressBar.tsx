/**
 * Volume Progress Bar Component
 * Visual indicator for credit utilization levels
 */

'use client';

interface VolumeProgressBarProps {
  percentage: number; // 0-100
}

export function VolumeProgressBar({ percentage }: VolumeProgressBarProps) {
  // Create bars that span the full width
  const barCount = 45;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const position = (i / (barCount - 1)) * 100; // Position from 0-100%
    
    // Determine if this is a boundary marker bar (tall)
    const isBoundaryMarker = 
      Math.abs(position - 25) < 1 || // 25% boundary
      Math.abs(position - 30) < 1;   // 30% boundary
    
    // Determine if this bar is filled (before the percentage marker)
    const isFilled = position <= percentage;
    
    // Determine height based on whether it's a boundary marker
    const heightClass = isBoundaryMarker ? 'h-10' : 'h-4';
    
    // Determine color based on position (zone) and fill status
    let colorClass: string;
    
    if (position <= 25) {
      // Green zone (0-25%)
      colorClass = isFilled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600';
    } else if (position <= 30) {
      // Orange/Yellow zone (26-30%)
      colorClass = isFilled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600';
    } else {
      // Red zone (30%+)
      colorClass = isFilled ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600';
    }
    
    return { heightClass, colorClass };
  });

  return (
    <div className="w-full">
      {/* Volume Bars */}
      <div className="flex items-center justify-between h-14 mb-3 px-1">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${bar.heightClass} ${bar.colorClass}`}
          />
        ))}
      </div>
      
      {/* Labels */}
      <div className="grid grid-cols-3 text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium text-left">0-25% Safe</span>
        <span className="font-medium text-center">26-30% Caution</span>
        <span className="font-medium text-right">30%+ Danger</span>
      </div>
    </div>
  );
}
