/**
 * Phone Mockup Component
 * Interactive iPhone-style mockup for credit app overview
 */

'use client';

import { useRef } from 'react';
import { Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhoneMockupProps {
  clickedItemId: string | null;
  onItemClick: (termId: string) => void;
}

export function PhoneMockup({ clickedItemId, onItemClick }: PhoneMockupProps) {
  const phoneContentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-2xl bg-muted p-6">
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        Interactive View
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Click on each <Info className="inline h-3 w-3" /> point to learn what it means
      </p>

      {/* Phone Mockup - iPhone Style */}
      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.5rem] border-[14px] border-foreground bg-background shadow-2xl">
          {/* iPhone Notch */}
          <div className="absolute left-1/2 top-0 z-30 h-7 w-36 -translate-x-1/2 rounded-b-3xl bg-foreground" />
          
          {/* iPhone Status Bar */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-8 pt-2 text-[11px] text-foreground">
            <span className="font-semibold">12:17</span>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <path d="M12 20h.01" />
              </svg>
              <svg className="h-3.5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                <path d="M23 13v-2" />
              </svg>
            </div>
          </div>

          {/* Gray Overlay */}
          {clickedItemId && (
            <div 
              className="absolute inset-0 z-10 bg-foreground/60 backdrop-blur-[1px] cursor-pointer"
              onClick={() => onItemClick(clickedItemId)}
              aria-label="Close details"
            />
          )}

          {/* Phone Content */}
          <div ref={phoneContentRef} className="relative h-full overflow-y-auto px-4 pb-6 pt-10">
            {/* App Header */}
            <div className="mb-4 flex items-center justify-between">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              <button className="h-6 w-6 rounded-full border-2 border-border" />
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-4 border-b border-border">
              <button className="border-b-2 border-foreground pb-2 text-sm font-medium text-foreground">
                Summary
              </button>
              <button 
                id="transactions"
                onClick={() => onItemClick('transactions')}
                className={`pb-2 text-sm font-medium flex items-center gap-1 transition-colors rounded px-2 ${
                  clickedItemId === 'transactions' 
                    ? 'z-20 bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Transactions
                <Info className="h-3 w-3" />
              </button>
            </div>

            {/* Credit Details Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Credit Details</h4>
              
              <div className="space-y-3 text-xs">
                <PhoneItem
                  id="credit-available"
                  label="Credit Available"
                  value="$2,500.00"
                  isActive={clickedItemId === 'credit-available'}
                  onClick={onItemClick}
                />
                
                <PhoneItem
                  id="pending"
                  label="Pending"
                  value="-$548.73"
                  isActive={clickedItemId === 'pending'}
                  onClick={onItemClick}
                />
                
                <PhoneItem
                  id="credit-limit"
                  label="Credit Limit"
                  value="$2,500.00"
                  isActive={clickedItemId === 'credit-limit'}
                  onClick={onItemClick}
                />
              </div>

              {/* Statement Details */}
              <div className="border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Statement Details</h4>
                  <button className="text-xs text-brand">View eStatement</button>
                </div>
                
                <div className="space-y-3 text-xs">
                  <PhoneItem
                    id="statement-date"
                    label="Statement Date"
                    value="Oct 25, 2025"
                    isActive={clickedItemId === 'statement-date'}
                    onClick={onItemClick}
                  />
                  
                  <PhoneItem
                    id="amount-due"
                    label="Amount Due"
                    value="$78.43"
                    isActive={clickedItemId === 'amount-due'}
                    onClick={onItemClick}
                  />
                  
                  <PhoneItem
                    id="minimum-payment"
                    label="Minimum Payment"
                    value="$10.00"
                    isActive={clickedItemId === 'minimum-payment'}
                    onClick={onItemClick}
                  />
                  
                  <PhoneItem
                    id="due-date"
                    label="Due Date"
                    value="Nov 17, 2025"
                    isActive={clickedItemId === 'due-date'}
                    onClick={onItemClick}
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-border pt-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Payment Details</h4>
                
                <div className="space-y-3 text-xs">
                  <PhoneItem
                    id="last-payment-amount"
                    label="Last Payment Amount"
                    value="$200.00"
                    isActive={clickedItemId === 'last-payment-amount'}
                    onClick={onItemClick}
                  />
                  
                  <PhoneItem
                    id="last-payment-date"
                    label="Last Payment Date"
                    value="Nov 13, 2025"
                    isActive={clickedItemId === 'last-payment-date'}
                    onClick={onItemClick}
                  />
                </div>
              </div>

              {/* More Options */}
              <div className="border-t border-border pt-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">More Options</h4>
                <div className="relative z-20 space-y-2">
                  <button className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-xs text-foreground hover:bg-muted/80 transition-colors">
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-background" />
                      Make a Payment
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-xs text-foreground hover:bg-muted/80 transition-colors">
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-background" />
                      Manage My Card
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-xs text-foreground hover:bg-muted/80 transition-colors">
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-background" />
                      Choose PIN
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Phone Item Component
interface PhoneItemProps {
  id: string;
  label: string;
  value: string;
  isActive: boolean;
  onClick: (id: string) => void;
}

function PhoneItem({ id, label, value, isActive, onClick }: PhoneItemProps) {
  return (
    <button
      id={`phone-item-${id}`}
      onClick={() => onClick(id)}
      className={`relative flex w-full items-center justify-between rounded px-2 py-1 transition-colors ${
        isActive ? 'z-20 bg-background shadow-sm' : 'hover:bg-muted/50'
      }`}
    >
      <span className="flex items-center gap-1 text-muted-foreground">
        {label}
        <Info className="h-3 w-3" />
      </span>
      <span className={`${isActive ? 'font-semibold' : ''} text-foreground`}>{value}</span>
    </button>
  );
}
