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
  const barCount = 60;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const position = (i / (barCount - 1)) * 100; // Use barCount - 1 for accurate positioning
    
    // Determine if this is a boundary marker bar (tall)
    const isBoundaryMarker = 
      Math.abs(position - 30) < 1 || // 30% boundary
      Math.abs(position - 70) < 1;   // 70% boundary
    
    // Determine height and color
    let heightClass: string;
    let colorClass: string;
    
    if (position <= percentage && !isBoundaryMarker) {
      // Active bars (green and tall)
      heightClass = 'h-8';
      colorClass = 'bg-green-500';
    } else if (isBoundaryMarker) {
      // Boundary markers (gray and tallest)
      heightClass = 'h-10';
      colorClass = 'bg-gray-300 dark:bg-gray-600';
    } else {
      // Inactive bars (gray and short)
      heightClass = 'h-2';
      colorClass = 'bg-gray-300 dark:bg-gray-600';
    }
    
    return { heightClass, colorClass };
  });

  return (
    <div className="w-full">
      {/* Volume Bars */}
      <div className="flex items-center justify-between h-12 mb-3 px-1">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${bar.heightClass} ${bar.colorClass}`}
          />
        ))}
      </div>
      
      {/* Labels */}
      <div className="grid grid-cols-3 text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium text-left">0-30% Safe</span>
        <span className="font-medium text-center">Caution</span>
        <span className="font-medium text-right">Danger</span>
      </div>
    </div>
  );
}
