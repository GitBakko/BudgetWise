
"use client";

import { icons, type LucideProps, HelpCircle } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];

  if (!LucideIcon) {
    // Fallback icon
    return <HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default DynamicIcon;
