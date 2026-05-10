import { useI18n } from "@/contexts/i18nContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, ChevronDown } from "lucide-react";

const LANGUAGES = [
  { code: "en" as const, label: "EN", name: "English", flag: "🇺🇸" },
  { code: "ko" as const, label: "KO", name: "한국어", flag: "🇰🇷" },
  { code: "ja" as const, label: "JA", name: "日本語", flag: "🇯🇵" },
  { code: "zh" as const, label: "CN", name: "中文", flag: "🇨🇳" },
];

interface LanguageSelectorProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function LanguageSelector({
  variant = "outline",
  className = "",
}: LanguageSelectorProps) {
  const { language, setLanguage } = useI18n();
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={`gap-1.5 font-medium px-3 ${className}`}
        >
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{current.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-2.5 cursor-pointer ${
              language === lang.code ? "bg-accent font-semibold" : ""
            }`}
          >
            <span className="text-base leading-none">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
