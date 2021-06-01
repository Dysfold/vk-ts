import { Player } from 'org.bukkit.entity';
import { sprintf } from 'sprintf-js';

interface Translations {
  fi_fi: string;
  en_us: string;
  [locale: string]: string;
}
const TRANSLATIONS = new Map<string, Translations>();

/**
 * Translate a string to correct language
 * @param player Who is receiving the message
 * @param key Translation key for the message
 * @param formatArgs Arguments to be added to the translated string
 * @returns The translated string
 */
export function localize(player: Player, key: string, ...formatArgs: string[]) {
  const locale = player.locale.toString();
  const msg = translateKey(key, locale);

  return sprintf(msg, ...formatArgs);
}

/**
 * Get a translator function. It can be used as:
 * tr("hello_world", "Hi");
 * @param player Player who will be receiving the message
 * @returns Function to call for translation
 */
export function getTranslator(player: Player) {
  return (key: string, ...formatArgs: string[]) =>
    localize(player, key, ...formatArgs);
}

function translateKey(key: string, locale: string) {
  const translations = TRANSLATIONS.get(key);
  if (!translations) {
    log.error(`Missing translation for key "${key}"`);
    return 'Missing translation';
  }

  return translations[locale] || translations.en_us;
}

/**
 * @param key Translation key for the message
 * @param translations All translations with where format aruments are %s. For example "Hello %s"
 */
export function addTranslation(key: string, translations: Translations) {
  TRANSLATIONS.set(key, translations);
}
