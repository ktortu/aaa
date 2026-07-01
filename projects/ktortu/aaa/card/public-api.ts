import { KtCard, KtCardActions, KtCardContent, KtCardHeader, KtCardLink, KtCardMedia } from './card';

export * from './card';

/**
 * Import ergonomique de toute la famille card en une fois :
 * `imports: [KtCardImports]` au lieu d'énumérer chaque directive.
 */
export const KtCardImports = [KtCard, KtCardHeader, KtCardMedia, KtCardContent, KtCardActions, KtCardLink] as const;
