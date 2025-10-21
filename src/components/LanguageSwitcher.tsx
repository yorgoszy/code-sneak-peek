import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-none">
          <Globe className="h-4 w-4 mr-2" />
          {i18n.language === 'el' ? 'ΕΛ' : i18n.language === 'ar' ? 'AR' : 'EN'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="rounded-none">
        <DropdownMenuItem 
          onClick={() => changeLanguage('el')}
          className={i18n.language === 'el' ? 'bg-gray-100' : ''}
        >
          🇬🇷 Ελληνικά
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('en')}
          className={i18n.language === 'en' ? 'bg-gray-100' : ''}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage('ar')}
          className={i18n.language === 'ar' ? 'bg-gray-100' : ''}
        >
          🇹🇳 العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
