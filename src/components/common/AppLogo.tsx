import Image from 'next/image';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const containerClass =
    size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-3' : 'gap-2';
  const imageSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className={`flex items-center ${containerClass}`} aria-label="MyDocula Logo">
      <Image 
        src="/logo.png" 
        alt="MyDocula Logo" 
        width={imageSize} 
        height={imageSize}
        // You can uncomment the line below if your logo has a white background 
        // and you want it to blend on dark mode
        // className="dark:invert"
      />
      <span className={`${textSize} font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent`}>MyDocula</span>
    </div>
  );
}
