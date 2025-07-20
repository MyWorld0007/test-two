
import { HeartPulse } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="Profile Hub Logo">
        <HeartPulse className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold tracking-tight">
            Profile Hub
        </span>
    </div>
  );
}

    