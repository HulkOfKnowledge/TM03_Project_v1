/**
 * Credit Card Mockup Component
 * Interactive credit card mockup showing front and back of a credit card
 */

'use client';

import { useState, useEffect } from 'react';
import { Info, RotateCcw } from 'lucide-react';

interface CreditCardMockupProps {
  clickedItemId: string | null;
  onItemClick: (termId: string) => void;
}

export function CreditCardMockup({ clickedItemId, onItemClick }: CreditCardMockupProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-flip to back when CVV is clicked
  const handleItemClick = (termId: string) => {
    if (termId === 'cvv') {
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
    }
    onItemClick(termId);
  };

  // Handle external clicks from accordion - flip to appropriate side
  useEffect(() => {
    if (clickedItemId === 'cvv') {
      setIsFlipped(true);
    } else if (clickedItemId) {
      setIsFlipped(false);
    }
  }, [clickedItemId]);

  return (
    <div className="rounded-2xl bg-muted p-6">
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Interactive View
      </h3>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Click on each <Info className="inline h-3 w-3" /> point to learn what it means
      </p>

      {/* Card Container */}
      <div className="relative mx-auto w-full max-w-[400px] perspective-1000">
        <div
          className={`relative transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Front of Card */}
          <div className="backface-hidden">
            <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl">
              {/* Gray Overlay */}
              {clickedItemId && clickedItemId !== 'cvv' && (
                <div 
                  className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[1px] cursor-pointer rounded-2xl"
                  onClick={() => onItemClick(clickedItemId)}
                  aria-label="Close details"
                />
              )}

              {/* Card Network Logo (Top Right) */}
              <div className="absolute right-6 top-6 z-20">
                <CardItem
                  id="card-network"
                  isActive={clickedItemId === 'card-network'}
                  onClick={handleItemClick}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-10 w-14 items-center justify-center rounded bg-white/10 backdrop-blur-sm">
                      <div className="h-6 w-6 rounded-full bg-red-500 opacity-80"></div>
                      <div className="absolute right-4 h-6 w-6 rounded-full bg-yellow-500 opacity-80"></div>
                    </div>
                    <Info className="h-4 w-4 text-white" />
                  </div>
                </CardItem>
              </div>

              {/* Chip */}
              <div className="absolute left-6 top-16">
                <div className="h-10 w-12 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-md">
                  <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[2px] p-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="rounded-sm bg-yellow-600/30"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contactless Icon */}
              <div className="absolute left-20 top-16">
                <div className="flex h-10 items-center justify-center">
                  <svg className="h-6 w-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 18c3.314 0 6-2.686 6-6s-2.686-6-6-6" />
                    <path d="M12 14c1.657 0 3-1.343 3-3s-1.343-3-3-3" />
                  </svg>
                </div>
              </div>

              {/* Card Number */}
              <div className="absolute left-6 top-32 right-6 z-20">
                <CardItem
                  id="card-number"
                  isActive={clickedItemId === 'card-number'}
                  onClick={handleItemClick}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xl tracking-wider text-white">
                      1111-2222-3333-4444
                    </span>
                    <Info className="h-4 w-4 text-white" />
                  </div>
                </CardItem>
              </div>

              {/* Card Holder Name and Expiry */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                {/* Card Holder */}
                <div className="z-20">
                  <CardItem
                    id="card-holder"
                    isActive={clickedItemId === 'card-holder'}
                    onClick={handleItemClick}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          Card Holder
                        </span>
                        <Info className="h-3 w-3 text-white" />
                      </div>
                      <p className="font-medium uppercase tracking-wide text-white">
                        John Doe
                      </p>
                    </div>
                  </CardItem>
                </div>

                {/* Expiry Date */}
                <div className="z-20">
                  <CardItem
                    id="expiry-date"
                    isActive={clickedItemId === 'expiry-date'}
                    onClick={handleItemClick}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          Expires
                        </span>
                        <Info className="h-3 w-3 text-white" />
                      </div>
                      <p className="font-mono text-sm text-white">12/28</p>
                    </div>
                  </CardItem>
                </div>
              </div>
            </div>
          </div>

          {/* Back of Card */}
          <div className="absolute top-0 left-0 w-full backface-hidden rotate-y-180">
            <div className="relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl">
              {/* Gray Overlay */}
              {clickedItemId && clickedItemId === 'cvv' && (
                <div 
                  className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[1px] cursor-pointer rounded-2xl"
                  onClick={() => onItemClick(clickedItemId)}
                  aria-label="Close details"
                />
              )}

              {/* Magnetic Stripe */}
              <div className="absolute top-6 left-0 right-0 h-12 bg-gray-950"></div>

              {/* Signature Strip and CVV */}
              <div className="absolute top-24 left-6 right-6 h-10 bg-white rounded-sm flex items-center justify-end px-3">
                <div className="z-20">
                  <CardItem
                    id="cvv"
                    isActive={clickedItemId === 'cvv'}
                    onClick={handleItemClick}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-900 bg-gray-200 px-2 py-1 rounded italic">
                        123
                      </span>
                      <Info className="h-4 w-4 text-gray-700" />
                    </div>
                  </CardItem>
                </div>
              </div>

              {/* Fine Print */}
              <div className="absolute bottom-8 left-6 right-6">
                <div className="space-y-1 text-[8px] text-gray-400">
                  <p>This card is property of the issuing bank and must be returned upon request.</p>
                  <p>Unauthorized use is prohibited and punishable by law.</p>
                </div>
              </div>

              {/* Card Network Logo (Bottom Right) */}
              <div className="absolute right-6 bottom-4">
                <div className="relative flex h-8 w-12 items-center justify-center rounded bg-white/10 backdrop-blur-sm">
                  <div className="h-5 w-5 rounded-full bg-red-500 opacity-80"></div>
                  <div className="absolute right-3 h-5 w-5 rounded-full bg-yellow-500 opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Flip Toggle Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-400 px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          {isFlipped ? 'Show Front' : 'Show Back'}
        </button>
      </div>

    </div>
  );
}

// Card Item Component
interface CardItemProps {
  id: string;
  isActive: boolean;
  onClick: (id: string) => void;
  children: React.ReactNode;
}

function CardItem({ id, isActive, onClick, children }: CardItemProps) {
  return (
    <button
      id={`phone-item-${id}`}
      onClick={() => onClick(id)}
      className={`relative rounded px-2 py-1 transition-all ${
        isActive 
          ? 'bg-white/20 backdrop-blur-md shadow-lg ring-2 ring-white/50' 
          : 'hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
