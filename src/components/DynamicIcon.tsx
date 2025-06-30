
"use client";

import { icons, type LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const LucideIcon = icons[name as keyof typeof icons];

  if (!LucideIcon) {
    // Fallback icon
    return <icons.HelpCircle {...props} />;
  }

  return <LucideIcon {...props} />;
};

export default DynamicIcon;
