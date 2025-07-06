import { AppIcon } from './AppIcon';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  // Using width to control the size, which is more direct for your request.
  const iconWidth = size === 'sm' ? 'w-14' : size === 'lg' ? 'w-28' : 'w-24';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
      <AppIcon className={`${iconWidth} h-auto`} />
      <h1 className={`${textSize} font-bold text-primary`}>MyDocula</h1>
    </div>
  );
}
