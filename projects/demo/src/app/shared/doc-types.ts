/** Types partagés des tableaux de documentation (props & tokens). */

/** Une ligne du tableau des propriétés publiques d'un composant. */
export interface PropRow {
  /** Nom de l'input/propriété. */
  name: string;
  /** Type TypeScript (affiché tel quel). */
  type: string;
  /** Valeur par défaut (`''` → affiché « — »). */
  default: string;
  /** Rôle de la propriété. */
  description: string;
}

/** Une ligne du tableau des tokens CSS. */
export interface TokenRow {
  /** Nom de la variable CSS (ex. `--btn-radius`). */
  name: string;
  /** Valeur (ou comportement) par défaut, surchargeable en redéclarant le token. */
  default: string;
  /** Ce que le token contrôle. */
  description: string;
}

/** Un groupe de tokens (palier) du tableau des tokens. */
export interface TokenGroup {
  /** Titre du palier (ex. « Bases », « Géométrie »). */
  title: string;
  /** Tokens du groupe. */
  tokens: TokenRow[];
}
