// Harness de test pour `kt-select` (single, mode desktop/activedescendant).
//
// PHASE 1 — INTERNE, NON PUBLIÉ. Ce fichier `*.harness.ts` est exclu du build de la lib
// (cf. tsconfig.lib.json) : il sert au dogfood interne avant toute décision de publication.
// La promotion en API publique (`@ktortu/aaa/forms/testing`) est une étape ultérieure.
//
// Règle de cohabitation harness ↔ internals :
//   - Tout comportement observable via le DOM (ce qu'un utilisateur/consommateur fait) se teste
//     PAR LE HARNESS.
//   - L'accès à l'instance (`internals(fixture)`) reste réservé aux cas white-box inatteignables
//     par le DOM (ex. purge interne du listbox quand le filtre masque la sélection).
//
// Limites assumées : pilote le mode desktop (focus `activedescendant`), pas le bottom-sheet tactile.
// Ne remplace PAS les tests d'accessibilité : ni clavier complet, ni focus trap, ni contraste (→ axe).
import { BaseHarnessFilters, ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import { KtFieldHarness } from '../field/field.harness';

/** Critères de ciblage d'une option du listbox. */
export interface KtSelectOptionHarnessFilters extends BaseHarnessFilters {
  /** Filtre par texte de l'option. */
  text?: string | RegExp;
}

/** Harness pour une option (`<li>` interactif) du listbox d'un `kt-select`. */
export class KtSelectOptionHarness extends ComponentHarness {
  // Cible les vraies options interactives, pas les lignes « liste vide »/« tronqué » (info-only).
  static hostSelector = '.kt-select__option';

  static with(filters: KtSelectOptionHarnessFilters = {}): HarnessPredicate<KtSelectOptionHarness> {
    return new HarnessPredicate(KtSelectOptionHarness, filters).addOption('text', filters.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Libellé de l'option (hors glyphe de la checkbox affiché en mode multi-sélection). */
  async getText(): Promise<string> {
    return (await (await this.host()).text({ exclude: '.kt-select__checkbox' })).trim();
  }

  /** L'option est-elle désactivée ? (`aria-disabled="true"`). */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** L'option est-elle sélectionnée ? (`aria-selected="true"`). */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /** Clique l'option. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Critères de ciblage d'un `KtSelectHarness`. */
export interface KtSelectHarnessFilters extends BaseHarnessFilters {
  /** Filtre par texte du label du champ. */
  label?: string | RegExp;
}

/** Harness ARIA-first pour `kt-select`. */
export class KtSelectHarness extends ComponentHarness {
  static hostSelector = 'kt-select';

  /** Prédicat de recherche (ex. `loader.getHarness(KtSelectHarness.with({ label: 'Pays' }))`). */
  static with(filters: KtSelectHarnessFilters = {}): HarnessPredicate<KtSelectHarness> {
    return new HarnessPredicate(KtSelectHarness, filters).addOption('label', filters.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  private readonly trigger = this.locatorFor('.kt-select__trigger');
  private readonly valueEl = this.locatorFor('.kt-select__value');
  private readonly labelEl = this.locatorForOptional('label');
  private readonly field = this.locatorFor(KtFieldHarness);
  private readonly filterInputEl = this.locatorForOptional('.kt-select__filter-input');
  private readonly activeOptionEl = this.locatorForOptional('.kt-select__option--active');
  private readonly clearButton = this.locatorForOptional('.kt-select__clear');

  /** Texte du label associé (chaîne vide si absent). */
  async getLabel(): Promise<string> {
    const el = await this.labelEl();
    return el ? (await el.text()).trim() : '';
  }

  /** Harness du `kt-field` qui enveloppe le contrôle (label, hint, erreurs). */
  async getField(): Promise<KtFieldHarness> {
    return this.field();
  }

  /** Le popup est-il ouvert ? (lecture de `aria-expanded` sur le trigger). */
  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  /** Le select est-il désactivé ? (propriété `disabled` du trigger). */
  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  /** Validation asynchrone en cours ? (`aria-busy="true"` sur le trigger). */
  async isPending(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-busy')) === 'true';
  }

  /** L'erreur de validation est-elle affichée ? (`data-invalid` sur le trigger — soit `invalid && touched`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('data-invalid')) !== null;
  }

  /** Ouvre le popup via le geste clavier WAI-ARIA (Flèche bas ; no-op si déjà ouvert). */
  async open(): Promise<void> {
    if (await this.isOpen()) return;
    const trigger = await this.trigger();
    await trigger.focus();
    await trigger.sendKeys(TestKey.DOWN_ARROW);
  }

  /** Ferme le popup via Échap (no-op si déjà fermé). */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }

  /** Texte affiché dans le trigger (placeholder si aucune sélection). */
  async getValueText(): Promise<string> {
    return (await (await this.valueEl()).text()).trim();
  }

  /** Le bouton « effacer » (clearable) est-il présent ? (visible seulement avec une valeur). */
  async isClearAvailable(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Efface la sélection via le bouton « effacer » (no-op s'il est absent). */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (button) await button.click();
  }

  /** Saisit du texte dans le champ de filtre (mode filtrable). Ouvre le popup au besoin. */
  async filter(text: string): Promise<void> {
    await this.open();
    const input = await this.filterInputEl();
    if (!input) {
      throw new Error("KtSelectHarness: ce select n'est pas filtrable (aucun champ de filtre).");
    }
    await input.clear();
    await input.sendKeys(text);
  }

  /** Vide le champ de filtre (no-op si non filtrable ou déjà vide). */
  async clearFilter(): Promise<void> {
    const input = await this.filterInputEl();
    if (input) await input.clear();
  }

  /** Texte courant du champ de filtre (vide si non filtrable). */
  async getFilterText(): Promise<string> {
    const input = await this.filterInputEl();
    return input ? input.getProperty<string>('value') : '';
  }

  /**
   * Envoie des touches de navigation au champ de filtre (ArrowDown/Home/Enter/Tab/Escape…).
   * Ouvre le popup au besoin. Lève si le select n'est pas filtrable.
   */
  async pressInFilter(...keys: (string | TestKey)[]): Promise<void> {
    await this.open();
    const input = await this.filterInputEl();
    if (!input) {
      throw new Error("KtSelectHarness: ce select n'est pas filtrable (aucun champ de filtre).");
    }
    await input.sendKeys(...keys);
  }

  // Live region (role=status) qui annonce le nombre de résultats du filtre. `.kt-select__sr-only`
  // la distingue du statut des chips (`.kt-chip-list__status`), lui aussi role=status en multi-select.
  private readonly announceEl = this.locatorForOptional('.kt-select__sr-only[role="status"]');

  /** Texte courant de la live region d'annonce du filtre (vide si absente ou rien d'annoncé). */
  async getAnnouncement(): Promise<string> {
    const el = await this.announceEl();
    return el ? (await el.text()).trim() : '';
  }

  /**
   * Attend l'annonce DIFFÉRÉE du filtre (debounce anti-spam SR). Pilote l'attente par le CONTENU,
   * pas par une durée : aucune dépendance au timing interne (`ANNOUNCE_DELAY_MS`) côté test.
   * Sonde la live region en timers RÉELS jusqu'à `matcher` (ou tout texte non vide si omis),
   * ou jusqu'à expiration. Retourne le dernier texte lu.
   */
  async waitForAnnouncement(matcher?: string | RegExp, timeoutMs = 2000): Promise<string> {
    const stepMs = 25;
    const matches = (t: string): boolean =>
      matcher === undefined ? t !== '' : typeof matcher === 'string' ? t === matcher : matcher.test(t);
    let text = await this.getAnnouncement();
    for (let waited = 0; waited < timeoutMs && !matches(text); waited += stepMs) {
      await new Promise((resolve) => setTimeout(resolve, stepMs));
      text = await this.getAnnouncement();
    }
    return text;
  }

  /** Texte de l'option active (navigation clavier ; ouvre le popup au besoin). Vide si aucune. */
  async getActiveOptionText(): Promise<string> {
    await this.open();
    const active = await this.activeOptionEl();
    return active ? (await active.text()).trim() : '';
  }

  /** Harnesses des options rendues (ouvre le popup au besoin). */
  async getOptions(filter: KtSelectOptionHarnessFilters = {}): Promise<KtSelectOptionHarness[]> {
    await this.open();
    return this.locatorForAll(KtSelectOptionHarness.with(filter))();
  }

  /** Première option correspondant au filtre (ouvre le popup au besoin). */
  async getOption(filter: KtSelectOptionHarnessFilters): Promise<KtSelectOptionHarness> {
    await this.open();
    return this.locatorFor(KtSelectOptionHarness.with(filter))();
  }

  /** Libellés des options actuellement rendues (ouvre le popup au besoin). */
  async getOptionTexts(): Promise<string[]> {
    const options = await this.getOptions();
    return Promise.all(options.map((o) => o.getText()));
  }

  /** Ouvre puis clique l'option dont le texte correspond. */
  async clickOption(filter: { text: string | RegExp }): Promise<void> {
    const [option] = await this.getOptions({ text: filter.text });
    if (!option) {
      throw new Error(`KtSelectHarness: aucune option ne correspond à "${String(filter.text)}"`);
    }
    await option.click();
  }
}
