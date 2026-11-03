import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface BannerProps {
  title: string;
  detail: string;
  action: ReactNode;
  onDismiss?: () => void;
}

/**
 * The full-width key-colour band Apple pins under the player for signed-out
 * visitors (report §1). An invitation, not an error.
 */
export function Banner({ title, detail, action, onDismiss }: BannerProps) {
  return (
    <div
      className="relative z-(--z-web-chrome) flex min-h-[71px] items-center gap-4 bg-key-bg px-[30px] py-3 text-white max-sm:flex-wrap max-sm:gap-2 max-sm:pr-4 max-sm:pl-5 pb-[max(12px,env(safe-area-inset-bottom,0px))]"
      role="region"
      aria-label={title}
    >
      <div className="min-w-0 flex-1 max-sm:basis-full">
        <p className="type-title-2-emphasized max-sm:type-[700_15px/20px]">{title}</p>
        <p className="mt-0.5 type-callout-medium opacity-90">{detail}</p>
      </div>
      <div className="shrink-0">{action}</div>
      {onDismiss && (
        <button
          className="-mr-3.5 grid size-7 place-items-center rounded-full text-white opacity-85 hover:bg-[#ffffff26] hover:opacity-100"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

export const bannerButtonClass =
  'inline-flex h-8 items-center whitespace-nowrap rounded-pill bg-white px-4 type-body-emphasized text-black hover:bg-[#ffffffe0]';
