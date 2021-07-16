const TRANSLATION_KEY_TO_ENGLISH = new Map<string, string>();
const TRANSLATION_KEY_TO_VK_KEY = new Map<string, string>();
const VK_KEY_TO_TRANSLATION_KEY = new Map<string, string>();

interface LangMap {
  [translationKey: string]: string;
}

export async function fetchLangJson() {
  const response = await fetch(
    'https://raw.githubusercontent.com/Laetta/respack/master/assets/minecraft/lang/en_us.json',
  );
  const langMap: LangMap = await response.json();
  if (!langMap) {
    log.error('lang file missing!');
    return;
  }

  for (const [key, translation] of Object.entries(langMap)) {
    const vkKey = formatTranslationToKey(translation);

    TRANSLATION_KEY_TO_ENGLISH.set(key, translation);
    TRANSLATION_KEY_TO_VK_KEY.set(key, vkKey);
    VK_KEY_TO_TRANSLATION_KEY.set(vkKey, key);
  }
}

export function getRespackTranslation(translationKey: string) {
  return TRANSLATION_KEY_TO_ENGLISH.get(translationKey);
}

export function vkKeyToTranslationKey(vkKey: string) {
  return VK_KEY_TO_TRANSLATION_KEY.get(vkKey);
}

export function translationKeyToVkKey(translationKey: string) {
  return TRANSLATION_KEY_TO_VK_KEY.get(translationKey);
}

export function getFormattedRespackTranslation(translationKey: string) {
  // block.minecraft.damaged_anvil -> "Fermentation Barrel" -> "fermentation_barrel"
  const translation = getRespackTranslation(translationKey);
  if (translation == undefined) return;
  return formatTranslationToKey(translationKey);
}

function formatTranslationToKey(translation: string) {
  return translation.toLowerCase().replaceAll(' ', '_').replaceAll("'", '');
}
