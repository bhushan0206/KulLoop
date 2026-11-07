import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MyDharoharPrepNudgeProps {
  guideUrl: string;
  occasionTitle: string;
  /** Dark countdown card vs light surfaces */
  variant?: 'on-dark' | 'on-light';
}

/**
 * Context-only partner link — shown when an occasion has an explicit guide URL,
 * never as a standalone home hero card.
 */
export const MyDharoharPrepNudge: React.FC<MyDharoharPrepNudgeProps> = ({
  guideUrl,
  occasionTitle,
  variant = 'on-light',
}) => {
  const isDark = variant === 'on-dark';

  return (
    <p
      className={`text-[11px] leading-relaxed ${
        isDark ? 'text-stone-400 border-stone-800' : 'text-stone-600 border-stone-200'
      } pt-2 border-t`}
    >
      <span className={isDark ? 'text-stone-500' : 'text-stone-500'}>Optional checklist for </span>
      <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>{occasionTitle}</span>
      <span className={isDark ? 'text-stone-500' : 'text-stone-500'}> · </span>
      <a
        href={guideUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 font-medium underline underline-offset-2 ${
          isDark ? 'text-amber-300/90 hover:text-amber-200' : 'text-amber-900 hover:text-amber-800'
        }`}
      >
        Prep guide (MyDharohar)
        <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
      </a>
    </p>
  );
};
