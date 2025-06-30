
"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import DynamicIcon from "@/components/DynamicIcon";
import { ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const iconList = [ "ShoppingCart", "Home", "Car", "UtensilsCrossed", "Film", "Plane", "HeartPulse", "Gift", "BookOpen", "Briefcase", "GraduationCap", "PawPrint", "Landmark", "DollarSign", "Receipt", "Bus", "Train", "Bike", "Fuel", "Shirt", "Apple", "Pizza", "Coffee", "Gamepad2", "Laptop", "Phone", "Music", "Heart", "Star", "Cloud", "Sun", "Moon", "Droplets", "Bone", "Dog", "Cat", "Hammer", "Wrench", "Construction", "Baby" ];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = iconList.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <DynamicIcon name={value} className="h-4 w-4" />
            <span>{value}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cerca icona..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-6 gap-2 p-2">
            {filteredIcons.map((icon) => (
              <Button
                key={icon}
                variant="outline"
                size="icon"
                onClick={() => {
                  onChange(icon);
                  setOpen(false);
                }}
                className={cn("h-10 w-10", value === icon && "ring-2 ring-primary")}
              >
                <DynamicIcon name={icon} className="h-5 w-5" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
