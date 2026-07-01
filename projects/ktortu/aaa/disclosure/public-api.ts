import { KtDisclosure } from './disclosure';
import { KtDisclosureContent } from './disclosure-content';
import { KtDisclosureToggle } from './disclosure-toggle';

export * from './disclosure';
export * from './disclosure-toggle';
export * from './disclosure-content';
export * from './disclosure-token';

/**
 * Import ergonomique de toute la famille disclosure en une fois :
 * `imports: [KtDisclosureImports]` au lieu d'énumérer chaque marqueur.
 */
export const KtDisclosureImports = [KtDisclosure, KtDisclosureToggle, KtDisclosureContent] as const;
