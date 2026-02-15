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
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Click on each <Info className="inline h-3 w-3" /> point to learn what it means
      </p>

      {/* Phone Mockup - iPhone Style */}
      <div className="relative mx-auto w-full max-w-[280px]">
        {/* Phone Frame */}
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.5rem] border-[12px] border-gray-900 dark:border-black shadow-2xl shadow-black/50">
          {/* iPhone Notch */}
          <div className="absolute left-1/2 top-0 z-30 h-7 w-36 -translate-x-1/2 rounded-b-3xl bg-gray-900 dark:bg-gray-950" />
          
          {/* Screen Background - Light mode white, Dark mode dark gray */}
          <div className="absolute inset-0 bg-white dark:bg-gray-900" />
          
         

          {/* Gray Overlay */}
          {clickedItemId && (
            <div 
              className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[1px] cursor-pointer"
              onClick={() => onItemClick(clickedItemId)}
              aria-label="Close details"
            />
          )}

          {/* Phone Content - Scrollable area with app-like background */}
          <div 
            ref={phoneContentRef} 
            className="phone-scrollbar relative h-full overflow-y-auto px-4 pb-6 pt-10 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"
          >
            {/* App Header */}
            <div className="mb-4 flex items-center justify-between">
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <button className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-4 border-b border-gray-200 dark:border-gray-700 justify-between">
              <button className="border-b-2 border-brand pb-2 text-sm font-medium text-gray-900 dark:text-white">
                Summary
              </button>
              <button 
                id="transactions"
                onClick={() => onItemClick('transactions')}
                className={`pb-2 text-sm font-medium flex items-center gap-1 transition-colors rounded px-2 ${
                  clickedItemId === 'transactions' 
                    ? 'z-20 bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Transactions
                <Info className="h-3 w-3" />
              </button>
            </div>

            {/* Credit Details Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Credit Details</h4>
              
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
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Statement Details</h4>
                  <span className="text-xs">View eStatement</span>
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
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Payment Details</h4>
                
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
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">More Options</h4>
                <div className="relative z-20 space-y-2">
                  <button className="flex w-full items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                      Make a Payment
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button className="flex w-full items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                      Manage My Card
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  <button className="flex w-full items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2.5 text-xs text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
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
      className={`relative flex w-full items-center justify-between rounded px-1 py-1 transition-colors ${
        isActive 
          ? 'z-20 bg-white dark:bg-gray-800 shadow-sm' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        {label}
        <Info className="h-3 w-3" />
      </span>
      <span className={`${isActive ? 'font-semibold' : ''} text-gray-900 dark:text-white`}>{value}</span>
    </button>
  );
}
