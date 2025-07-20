import Image from 'next/image';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const height = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  // Use a fixed aspect ratio based on the provided logo
  const width = height * 3.5; // You might need to adjust this ratio to match your image

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
      <Image
        src="/logo.png"
        alt="MyDocula Logo"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
