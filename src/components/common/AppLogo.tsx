import { Building2 } from 'lucide-react';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
      <Building2 className={`${iconSize} text-primary`} />
      <h1 className={`${textSize} font-bold text-primary`}>MyDocula</h1>
    </div>
  );
}
