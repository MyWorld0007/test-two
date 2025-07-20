import { AppIcon } from './AppIcon';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const containerClass =
    size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-3' : 'gap-2';
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className={`flex items-center ${containerClass}`} aria-label="MyDocula Logo">
      <AppIcon className={iconSize} />
      <h1 className={`${textSize} font-bold text-primary`}>MyDocula</h1>
    </div>
  );
}
