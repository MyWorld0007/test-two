
import { HeartPulse } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface AppLogoProps {
    size?: 'default' | 'lg';
}

export function AppLogo({ size = 'default' }: AppLogoProps) {
  const iconSize = size === 'lg' ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === 'lg' ? "text-3xl" : "text-2xl";

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
        <HeartPulse className={`${iconSize} text-primary`} />
        <span className={`${textSize} font-bold tracking-tight`}>
            MyDocula
        </span>
    </div>
  );
}
