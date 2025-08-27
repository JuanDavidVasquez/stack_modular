import path from 'path';

export type SupportedLocale = 'en' | 'es';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'es'];
export const DEFAULT_LOCALE: SupportedLocale = 'es';

// Cache para las traducciones
const translationsCache = new Map<string, any>();

/**
 * Cargar archivo de traducción
 */
function loadTranslations(locale: SupportedLocale, namespace: string): any {
  const cacheKey = `${locale}-${namespace}`;
  
  if (translationsCache.has(cacheKey)) {
    return translationsCache.get(cacheKey);
  }

  try {
    const translations = require(path.join(__dirname, locale, `${namespace}.json`));
    translationsCache.set(cacheKey, translations);
    return translations;
  } catch (error) {
    console.warn(`Translation file not found: ${locale}/${namespace}.json`);
    
    // Fallback al idioma por defecto
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE, namespace);
    }
    
    return {};
  }
}

/**
 * Obtener valor anidado del objeto
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

/**
 * Función principal para obtener traducción - UN SOLO EXPORT
 * 
 * Ejemplos de uso:
 * t('user.validation.email.required', 'es')
 * t('user.messages.created', 'es')
 * t('auth.messages.loginSuccess', 'en')
 */
export function t(
  key: string, 
  locale: SupportedLocale = DEFAULT_LOCALE,
  params: Record<string, string | number> = {}
): string {
  try {
    // Separar namespace del key
    // 'user.validation.email.required' -> namespace: 'user', key: 'validation.email.required'
    const parts = key.split('.');
    const namespace = parts[0]; // 'user', 'auth', 'common', etc.
    const translationKey = parts.slice(1).join('.'); // 'validation.email.required'
    
    const translations = loadTranslations(locale, namespace);
    let text = getNestedValue(translations, translationKey) || key;
    
    // Reemplazar parámetros
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param].toString());
    });
    
    return text;
  } catch (error) {
    console.warn(`Translation error for key: ${key}`);
    return key;
  }
}