'use client';

interface Insight {
  type: 'alert' | 'achievement' | 'tip' | string;
  title: { en: string };
  message: { en: string };
  priority: 'urgent' | 'high' | 'medium' | string;
  action_required?: boolean;
}

interface RecommendedActionsProps {
  insights?: Insight[] | null;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-600',
  high:   'bg-orange-600',
  medium: 'bg-yellow-600',
};

function InsightIcon({ type }: { type: string }) {
  switch (type) {
    case 'alert':
      return <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    case 'achievement':
      return <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'tip':
      return <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    default:
      return <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  }
}

function DefaultActions() {
  const items = [
    {
      title: 'Enable payment reminders',
      description: 'Never miss a due date and protect your score effortlessly.',
      icon: <svg className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      title: 'Set usage alerts',
      description: 'Choose when Creduman warns you about high spending.',
      icon: <svg className="h-5 w-5 text-white sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    },
  ];

  return (
    <>
      <p className="mb-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:mb-6 sm:text-sm">
        No AI insights available yet. Connect more cards and build your payment history to receive
        personalized recommendations based on your credit profile.
      </p>
      <div className="space-y-3 sm:space-y-4">
        {items.map(item => (
          <div key={item.title} className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 sm:h-12 sm:w-12">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{item.title}</h3>
                <button className="text-xs text-gray-600 underline hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">Get Started</button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function RecommendedActions({ insights }: RecommendedActionsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mt-8 sm:p-6 lg:grid-cols-2 lg:gap-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              Recommended Actions
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Here is what you need to do based on your credit analysis
            </p>
          </div>
        </div>

        {insights && insights.length > 0 ? (
          <>
            <p className="mb-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:mb-6 sm:text-sm">
              Our AI has analyzed your credit profile and identified{' '}
              {insights.length} key {insights.length === 1 ? 'action' : 'actions'} to help you improve
              your credit health and achieve your financial goals.
            </p>
            <div className="space-y-3 sm:space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${PRIORITY_COLOR[insight.priority] ?? 'bg-indigo-600'} sm:h-12 sm:w-12`}>
                    <span className="text-white">
                      <InsightIcon type={insight.type} />
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{insight.title.en}</h3>
                      {insight.action_required && (
                        <button className="text-xs text-red-600 underline hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Take Action</button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">{insight.message.en}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <DefaultActions />
        )}
      </div>
      <div className="hidden rounded-lg bg-gray-100 dark:bg-gray-900 lg:block" />
    </div>
  );
}
