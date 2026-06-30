import type { PropRow } from '../../shared/doc-types';

/** Option de compétence pour le multi-select (clé + libellé). */
export interface SkillOption {
  id: string;
  name: string;
}

export const SHOWCASE_SKILLS: readonly SkillOption[] = [
  { id: 'ng', name: 'Angular' },
  { id: 'ts', name: 'TypeScript' },
  { id: 'rx', name: 'RxJS' },
  { id: 'css', name: 'CSS' },
  { id: 'a11y', name: 'Accessibilité' },
  { id: 'node', name: 'Node.js' },
];

/** Tableau « capacité Signal Forms → comment elle est mise en œuvre ici ». */
export const SHOWCASE_CAPS: readonly PropRow[] = [
  {
    name: 'Liaison',
    type: '[formField]',
    default: '—',
    description:
      'Un seul binding par contrôle : valeur, erreurs, états et contraintes sont synchronisés automatiquement.',
  },
  {
    name: 'Validation',
    type: 'required / email / minLength / pattern / min / max',
    default: '—',
    description:
      'Déclarée dans le schema ; les contraintes (minlength, pattern, required…) sont aussi posées en attributs natifs.',
  },
  {
    name: 'validate',
    type: 'validateur custom',
    default: '—',
    description: 'Date de naissance non future, acceptation des conditions (booléen requis = true).',
  },
  {
    name: 'validateTree',
    type: 'validation croisée',
    default: '—',
    description: 'Le mot de passe et sa confirmation doivent correspondre (erreur portée sur la confirmation).',
  },
  {
    name: 'validateAsync',
    type: 'pending',
    default: '—',
    description:
      "Disponibilité du nom d'utilisateur vérifiée en différé (simulée) ; le champ affiche un spinner pendant la vérification.",
  },
  {
    name: 'hidden / required',
    type: 'logique réactive',
    default: '—',
    description: 'Le champ téléphone n’apparaît et n’est requis que si le moyen de contact est « Téléphone ».',
  },
  {
    name: 'readonly',
    type: 'logique réactive',
    default: '—',
    description: "L'horodatage est en lecture seule (valeur figée à l'ouverture).",
  },
  {
    name: 'submit',
    type: 'focusBoundControl',
    default: '—',
    description: 'À la soumission invalide, le focus saute automatiquement sur le premier champ en erreur.',
  },
  {
    name: 'Accessibilité AAA',
    type: 'hint / helpText',
    default: '—',
    description:
      'Chaque champ porte une instruction (`hint`, liée via aria-describedby) ; les champs complexes ont une aide contextuelle (`helpText`, bouton accessible) — WCAG 3.3.2 et 3.3.5 (AAA).',
  },
];

/** Modes d'affichage d'une erreur (précédence : message du validateur > config > défaut embarqué). */
export const SHOWCASE_ERROR_MODES: readonly PropRow[] = [
  {
    name: "required(p.x, { message: 'Nom requis.' })",
    type: 'message explicite',
    default: 'rouge + ton texte',
    description: 'Le message passé au validateur prime toujours sur le défaut.',
  },
  {
    name: 'required(p.x)',
    type: 'message omis',
    default: 'rouge + défaut',
    description:
      'La lib affiche le message par défaut résolu par `kind` (français via provideKtDefaultFR, sinon anglais embarqué). Les contraintes paramétrées interpolent leur valeur (« Saisissez au moins 2 caractères. »).',
  },
  {
    name: "required(p.x, { message: '' })",
    type: 'message vide',
    default: 'rouge, sans texte',
    description:
      "Suppression explicite : le champ reste invalide (aria-invalid, bordure rouge) mais aucun texte n'est rendu. À réserver au cas où l'erreur est surfacée ailleurs (récapitulatif, tooltip, message cross-champ).",
  },
  {
    name: '[errorMatcher]="() => false"',
    type: 'input du champ',
    default: 'ni rouge ni texte',
    description:
      "L'errorMatcher décide QUAND flaguer le champ : renvoyer false n'affiche ni l'état invalide ni le message.",
  },
];

/** Snippet : brancher les défauts FR, surcharger un kind, puis les 3 modes au cas par cas. */
export const SHOWCASE_ERRORS_SNIPPET = `// 1) Tous les messages par défaut en français, en un appel (app.config.ts)
provideKtDefaultFR();

// 2) Surcharger un kind précis (fusionné par-dessus les défauts) — ou le supprimer avec ''
provideKtField({
  errorMessages: {
    required: 'Champ obligatoire.',
    minLength: (e) => \`Au moins \${ktErrorParam<number>(e, 'minLength')} caractères.\`,
  },
});

// 3) Au cas par cas, dans le schema Signal Forms
form(this.model, (p) => {
  required(p.lastName);                                // → message par défaut
  required(p.email, { message: 'E-mail requis.' });    // → message sur mesure
  required(p.token, { message: '' });                  // → rouge, sans texte (surfacé ailleurs)
});`;

export const SHOWCASE_TS_SNIPPET = `import { signal } from '@angular/core';
import { form, required, email, minLength, pattern, validateTree } from '@angular/forms/signals';

interface Account {
  email: string;
  password: string;
  confirmPassword: string;
}

protected readonly model = signal<Account>({ email: '', password: '', confirmPassword: '' });

protected readonly f = form(this.model, (p) => {
  required(p.email, { message: 'E-mail requis.' });
  email(p.email, { message: 'E-mail invalide.' });
  required(p.password);
  minLength(p.password, 8, { message: '8 caractères minimum.' });
  pattern(p.password, /(?=.*[A-Z])(?=.*\\d)/, { message: 'Une majuscule et un chiffre.' });
  validateTree(p, ({ value, fieldTreeOf }) =>
    value().password === value().confirmPassword
      ? undefined
      : { fieldTree: fieldTreeOf(p.confirmPassword), kind: 'mismatch', message: 'Les mots de passe diffèrent.' },
  );
});`;

export const SHOWCASE_HTML_SNIPPET = `<form>
  <!-- Un seul binding : [formField]. required, minlength, pattern, aria, erreurs => automatiques -->
  <kt-text-field label="E-mail" type="email" [formField]="f.email"
                 hint="Format attendu : nom@domaine.fr" />

  <!-- Accessibilité AAA : instruction (hint) + aide contextuelle (helpText, bouton accessible) -->
  <kt-text-field label="Mot de passe" type="password" [formField]="f.password"
                 hint="8 caractères minimum, dont une majuscule et un chiffre."
                 helpText="Utilisez un mot de passe unique mêlant lettres et chiffres."
                 helpLabel="Aide : mot de passe" />
  <kt-text-field label="Confirmer" type="password" [formField]="f.confirmPassword" />

  <button ktButton (click)="onSubmit()">Envoyer</button>
</form>

// onInvalid: focus automatique du premier champ invalide
async onSubmit() {
  await submit(this.f, {
    action: async () => { await save(this.model()); return undefined; },
    onInvalid: (form) => form().focusBoundControl(),
  });
}`;
