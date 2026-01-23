'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const LOCALES = [
    { code: 'en', label: 'English', flag: '🇬🇧', rtl: false },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷', rtl: false },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
] as const;

type LocaleCode = 'en' | 'tr' | 'ar';
type Translations = Partial<Record<LocaleCode, string>>;

interface TranslatableInputProps {
    label: string;
    value: Translations;
    onChange: (value: Translations) => void;
    placeholder?: string;
    required?: boolean;
}

export function TranslatableInput({
    label,
    value,
    onChange,
    placeholder,
    required,
}: TranslatableInputProps) {
    const [activeLocale, setActiveLocale] = useState<LocaleCode>('en');
    const currentLocale = LOCALES.find(l => l.code === activeLocale)!;

    const handleChange = (text: string) => {
        onChange({
            ...value,
            [activeLocale]: text,
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label} {required && '*'}</Label>
                <div className="flex gap-1">
                    {LOCALES.map((locale) => (
                        <button
                            key={locale.code}
                            type="button"
                            onClick={() => setActiveLocale(locale.code)}
                            className={cn(
                                "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                                activeLocale === locale.code
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80",
                                value[locale.code] && activeLocale !== locale.code && "ring-1 ring-green-500"
                            )}
                            title={value[locale.code] ? `${locale.label}: Has content` : `${locale.label}: Empty`}
                        >
                            <span>{locale.flag}</span>
                            <span className="uppercase">{locale.code}</span>
                        </button>
                    ))}
                </div>
            </div>
            <Input
                value={value[activeLocale] || ''}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                required={required && activeLocale === 'en'}
                dir={currentLocale.rtl ? 'rtl' : 'ltr'}
                className={cn(currentLocale.rtl && 'text-right')}
            />
            <p className="text-xs text-muted-foreground">
                Currently editing: {currentLocale.flag} {currentLocale.label}
                {!value[activeLocale] && activeLocale !== 'en' && ' (Empty - will fall back to English)'}
            </p>
        </div>
    );
}

interface TranslatableTextareaProps {
    label: string;
    value: Translations;
    onChange: (value: Translations) => void;
    placeholder?: string;
    rows?: number;
}

export function TranslatableTextarea({
    label,
    value,
    onChange,
    placeholder,
    rows = 5,
}: TranslatableTextareaProps) {
    const [activeLocale, setActiveLocale] = useState<LocaleCode>('en');
    const currentLocale = LOCALES.find(l => l.code === activeLocale)!;

    const handleChange = (text: string) => {
        onChange({
            ...value,
            [activeLocale]: text,
        });
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <div className="flex gap-1">
                    {LOCALES.map((locale) => (
                        <button
                            key={locale.code}
                            type="button"
                            onClick={() => setActiveLocale(locale.code)}
                            className={cn(
                                "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                                activeLocale === locale.code
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80",
                                value[locale.code] && activeLocale !== locale.code && "ring-1 ring-green-500"
                            )}
                            title={value[locale.code] ? `${locale.label}: Has content` : `${locale.label}: Empty`}
                        >
                            <span>{locale.flag}</span>
                            <span className="uppercase">{locale.code}</span>
                        </button>
                    ))}
                </div>
            </div>
            <Textarea
                value={value[activeLocale] || ''}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                dir={currentLocale.rtl ? 'rtl' : 'ltr'}
                className={cn(currentLocale.rtl && 'text-right')}
            />
            <p className="text-xs text-muted-foreground">
                Currently editing: {currentLocale.flag} {currentLocale.label}
                {!value[activeLocale] && activeLocale !== 'en' && ' (Empty - will fall back to English)'}
            </p>
        </div>
    );
}

// Helper to get translated content with fallback
export function getTranslatedContent(
    translations: Translations | null | undefined,
    locale: string,
    fallback: string = ''
): string {
    if (!translations) return fallback;
    return translations[locale as LocaleCode] || translations['en'] || fallback;
}
