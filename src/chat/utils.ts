import {
  BuildableComponent,
  Component,
  TranslatableComponent,
} from 'net.kyori.adventure.text';
import { Style, TextDecoration } from 'net.kyori.adventure.text.format';
import { PlainTextComponentSerializer } from 'net.kyori.adventure.text.serializer.plain';
import { Builder } from 'net.kyori.adventure.text.TextComponent';

const PLAIN_SERIALIZER = PlainTextComponentSerializer.plainText();

/**
 * Gets all plain text content from a chat component.
 * @param component Component to extract text from, or null.
 * @returns Plain text that would be shown in chat or console. This obviously
 * lacks any and all formatting that the text might have.
 */
export function getPlainText(component: Component | null): string {
  return PLAIN_SERIALIZER.serialize(component);
}

/**
 * Removes text decorations from a component. A new copy is returned;
 * the component itself is NOT modified.
 * @param component Component to remove decorations.
 * @param decorations Decorations to "remove".
 * @returns A new component without given styles.
 */
export function removeDecorations(
  component: Component,
  ...decorations: TextDecoration[]
): Component {
  if (decorations.length == 0) {
    throw new Error(
      'do not call removeDecorations() with no decorations given!',
    );
  }
  // Create style that removes desired decorations
  let style = Style.style();
  for (const decoration of decorations) {
    style = style.decoration(decoration, false);
  }

  if (component instanceof BuildableComponent) {
    // Turn component back into builder and apply styles
    return (component.toBuilder() as Builder).style(style.build()).build();
  } else {
    // Wrap component
    return Component.text().append(component).style(style.build()).build();
  }
}

/**
 * Checks if the given component is or contains translatable text.
 * @param component Component to check.
 * @returns Whether the given component or any component under it is
 * translatable.
 */
export function isTranslatable(component: Component): boolean {
  return getTranslationKey(component) !== undefined;
}

/**
 * Gets the first translation key from given component and components under it.
 * @param component Component to search for translatables.
 * @returns First encountered translatable key, or undefined if none were
 * found.
 */
export function getTranslationKey(component: Component): string | undefined {
  if (component instanceof TranslatableComponent) {
    return component.key(); // Directly translatable
  }
  for (const child of component.children()) {
    const key = getTranslationKey(child);
    if (key) {
      return key; // Child translatable
    }
  }
  return undefined; // No translatable component found
}
