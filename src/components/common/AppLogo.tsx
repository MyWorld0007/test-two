import { AppIcon } from './AppIcon';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-5' : size === 'lg' ? 'h-8' : 'h-6';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
      <AppIcon className={`${iconSize} w-auto`} />
      <h1 className={`${textSize} font-bold text-primary`}>MyDocula</h1>
    </div>
  );
}
