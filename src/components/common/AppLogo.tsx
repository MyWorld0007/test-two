
import Image from 'next/image';

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const height = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  // This ratio is an approximation based on the image provided earlier.
  // It might need slight adjustment based on the final PNG's dimensions.
  const width = height * 3.5; 

  return (
    <div className="flex items-center gap-2" aria-label="MyDocula Logo">
      <Image
        src="/logo.png" // This path automatically points to the public folder
        alt="MyDocula Logo"
        width={width}
        height={height}
        priority // Ensures the logo loads quickly
      />
    </div>
  );
}
