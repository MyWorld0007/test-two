import { AppIcon } from './AppIcon';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-4' : size === 'lg' ? 'h-7' : 'h-5';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
      <AppIcon className={`${iconSize} w-auto`} />
      <h1 className={`${textSize} font-bold text-primary`}>MyDocula</h1>
    </div>
  );
}
