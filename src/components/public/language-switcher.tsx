"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
] as const;

export function LanguageSwitcher({ className }: { className?: string }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("nav");

    const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

    const handleLanguageChange = (code: string) => {
        router.replace(pathname, { locale: code });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "gap-2 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors",
                        className
                    )}
                >
                    <span className="text-lg leading-none">{currentLang.flag}</span>
                    <span className="hidden sm:inline-block font-medium uppercase tracking-wide text-xs">
                        {currentLang.code}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-background/95 backdrop-blur-xl border-border/50">
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        className={cn(
                            "gap-3 cursor-pointer",
                            locale === lang.code && "bg-accent/10 text-accent font-medium"
                        )}
                        onClick={() => handleLanguageChange(lang.code)}
                    >
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <span className="text-sm">{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
