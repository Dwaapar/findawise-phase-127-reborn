// Simple useTranslation hook for the AdminSidebar component
import { useQuery } from '@tanstack/react-query';

export const useTranslation = () => {
  const { data: translations = {} } = useQuery({
    queryKey: ['/api/translations/en'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const translate = (key: string, params: Record<string, any> = {}, fallback: string = key) => {
    // Simple translation function that returns the fallback for now
    return fallback;
  };

  return {
    translate,
    translations
  };
};