'use client';
import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { HeartPulse, Stethoscope, Pill, Microscope, Plus } from 'lucide-react';

const icons = [HeartPulse, Stethoscope, Pill, Microscope, Plus];

interface Symbol {
  id: number;
  Icon: React.ElementType;
  style: CSSProperties;
  className: string;
}

interface HealthcareAnimationProps {
  animationType: number;
  symbolCount?: number;
}

export function HealthcareAnimation({ animationType, symbolCount = 25 }: HealthcareAnimationProps) {
  const [symbols, setSymbols] = useState<Symbol[]>([]);

  useEffect(() => {
    const generatedSymbols: Symbol[] = [];
    for (let i = 0; i < symbolCount; i++) {
      const Icon = icons[Math.floor(Math.random() * icons.length)];
      const duration = Math.random() * 8 + 7; // 7 to 15 seconds
      const delay = Math.random() * 10; // 0 to 10 seconds delay
      const size = Math.random() * 20 + 20; // 20px to 40px
      const left = Math.random() * 100;

      let animationName = 'fall';
      switch (animationType) {
        case 2:
          animationName = 'fall-rotate';
          break;
        case 3:
          animationName = 'fall-wave';
          break;
        case 4:
          animationName = 'fall-fade';
          break;
        default:
          animationName = 'fall';
      }
      
      generatedSymbols.push({
        id: i,
        Icon,
        style: {
          left: `${left}vw`,
          width: `${size}px`,
          height: `${size}px`,
          animation: `${animationName} ${duration}s linear ${delay}s infinite`,
        },
        className: 'healthcare-symbol'
      });
    }
    setSymbols(generatedSymbols);
  }, [animationType, symbolCount]);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      {symbols.map(({ id, Icon, style, className }) => (
        <Icon key={id} style={style} className={className} />
      ))}
    </div>
  );
}
