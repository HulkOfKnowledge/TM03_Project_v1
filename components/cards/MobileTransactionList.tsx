/**
 * Mobile Transaction List Component
 * Compact card list for transaction history on small screens
 */

'use client';

import { useMemo } from 'react';
import type { Transaction } from '@/types/card.types';
import {
	formatCurrency,
	formatDate,
	getZoneColor,
	getTransactionTypeColor,
} from './transaction-utils';

interface MobileTransactionListProps {
	data: Transaction[];
	onViewDetails: (transaction: Transaction) => void;
}

export function MobileTransactionList({ data, onViewDetails }: MobileTransactionListProps) {
	const groupedTransactions = useMemo(() => {
		const groups = new Map<string, Transaction[]>();
		for (const txn of data) {
			const current = groups.get(txn.date) ?? [];
			current.push(txn);
			groups.set(txn.date, current);
		}
		return Array.from(groups.entries());
	}, [data]);

	if (data.length === 0) {
		return (
			<div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
				<p className="text-sm text-gray-500 dark:text-gray-400">No transactions found for this page.</p>
			</div>
		);
	}

	return (
		<div className=" bg-white dark:border-gray-800 dark:bg-gray-950">
			{groupedTransactions.map(([date, dayTransactions], groupIndex) => (
				<section key={date}>
					<div className="bg-gray-100 px-3 py-2.5 dark:bg-gray-900/50 rounded-tl-xl rounded-tr-xl border border-gray-100 dark:border-gray-800">
						<p className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300">{formatDate(date)}</p>
					</div>

					{dayTransactions.map((txn) => (
						<div
							key={txn.id}
							className="border-t border-gray-200 px-3 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/40"
						>
							<div className="flex items-start justify-between gap-3 text-left">
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm leading-5 text-gray-900 dark:text-white">{txn.description}</p>
								<div className="mt-1 flex items-center gap-2">
									{txn.zone && (
										<span className={`inline-flex rounded px-2 py-0.5 text-[10px] ${getZoneColor(txn.zone)}`}>
											{txn.zone}
										</span>
									)}
									<p className="truncate text-xs text-gray-500 dark:text-gray-400">
										{txn.category || txn.merchantName || 'Transaction'}
									</p>
								</div>
							</div>

							<div className="shrink-0 text-right">
								<p className={`text-sm leading-5 ${getTransactionTypeColor(txn.amount)}`}>
									{txn.amount < 0 ? '-' : ''}
									{formatCurrency(txn.amount)}
								</p>
								{txn.balance !== undefined && (
									<p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
										{formatCurrency(txn.balance)}
									</p>
								)}
							</div>
							</div>

							<div className="mt-2 flex justify-end">
								<button
									onClick={() => onViewDetails(txn)}
									className="text-xs underline tracking-wide text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
								>
									View Details
								</button>
							</div>
						</div>
					))}

					{groupIndex !== groupedTransactions.length - 1 && (
						<div className="h-2 bg-gray-50 dark:bg-gray-900/30" />
					)}
				</section>
			))}
		</div>
	);
}
