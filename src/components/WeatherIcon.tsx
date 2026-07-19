import React from "react";
import * as Icons from "lucide-react";

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function WeatherIcon({ name, className = "", size }: WeatherIconProps) {
  // Safe map of allowed lucide-react icons
  const IconComponent = (Icons as any)[name];

  if (!IconComponent) {
    // Return a default icon if mapping isn't found
    return <Icons.Cloud className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}
