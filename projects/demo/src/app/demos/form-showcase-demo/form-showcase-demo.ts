import { ChangeDetectionStrategy, Component, resource, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  FormField,
  form,
  submit,
  required,
  email,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  validate,
  validateTree,
  validateAsync,
  hidden,
  readonly,
} from '@angular/forms/signals';

import {
  KtTextField,
  KtTextArea,
  KtNumberField,
  KtSwitch,
  KtCheckbox,
  KtCheckboxGroup,
  KtRadio,
  KtRadioGroup,
  KtSelect,
  KtMultiSelect,
  KtDateField,
  KtTimeField,
  KtDateTimeField,
  KtYearMonthField,
  KtInstantField,
  Temporal,
  type TemporalNamespace,
} from '@ktortu/aaa/forms';
import { KtButton } from '@ktortu/aaa/button';

import { CodeBlock } from '../../shared/code-block/code-block';
import { DocSection } from '../../shared/doc-section/doc-section';
import { PropsTable } from '../../shared/props-table/props-table';
import {
  SHOWCASE_CAPS,
  SHOWCASE_ERROR_MODES,
  SHOWCASE_ERRORS_SNIPPET,
  SHOWCASE_HTML_SNIPPET,
  SHOWCASE_SKILLS,
  SHOWCASE_TS_SNIPPET,
  type SkillOption,
} from './form-showcase-demo.data';

/** Modèle typé du formulaire vitrine : un compte/profil réaliste qui exerce tous les contrôles. */
interface ShowcaseModel {
  civility: 'mme' | 'm' | 'autre' | null;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number | null;
  birthDate: TemporalNamespace.PlainDate | null;
  preferredTime: TemporalNamespace.PlainTime | null;
  appointment: TemporalNamespace.PlainDateTime | null;
  cardExpiry: TemporalNamespace.PlainYearMonth | null;
  recordedAt: TemporalNamespace.Instant | null;
  country: string | null;
  skills: string[];
  contactMethod: 'email' | 'phone' | null;
  phone: string;
  interests: string[];
  bio: string;
  newsletter: boolean;
  acceptTerms: boolean;
}

/** Noms d'utilisateur « déjà pris » pour la validation async simulée (démontre l'état `pending`). */
const TAKEN_USERNAMES = ['admin', 'ada', 'root', 'test'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emptyModel(): ShowcaseModel {
  return {
    civility: null,
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: null,
    birthDate: null,
    preferredTime: null,
    appointment: null,
    cardExpiry: null,
    recordedAt: Temporal.Now.instant(),
    country: null,
    skills: [],
    contactMethod: null,
    phone: '',
    interests: [],
    bio: '',
    newsletter: false,
    acceptTerms: false,
  };
}

function sampleModel(): ShowcaseModel {
  return {
    civility: 'mme',
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'ada_l',
    email: 'ada@example.com',
    password: 'Calcul123',
    confirmPassword: 'Calcul123',
    age: 36,
    birthDate: Temporal.PlainDate.from('1989-12-10'),
    preferredTime: Temporal.PlainTime.from('09:30'),
    appointment: Temporal.PlainDateTime.from('2026-07-01T14:00'),
    cardExpiry: Temporal.PlainYearMonth.from('2030-08'),
    recordedAt: Temporal.Now.instant(),
    country: 'France',
    skills: ['ng', 'ts'],
    contactMethod: 'phone',
    phone: '+33 6 12 34 56 78',
    interests: ['sport', 'cinema'],
    bio: 'Pionnière de la programmation.',
    newsletter: true,
    acceptTerms: true,
  };
}

/**
 * Page vitrine Signal Forms : un seul modèle typé + un `schema()`, chaque contrôle lié par
 * `[formField]`. Validation déclarative, contraintes natives auto, états réactifs
 * (hidden/readonly), validation croisée et async (`pending`), submit avec focus du 1ᵉʳ champ invalide.
 */
@Component({
  selector: 'kt-form-showcase-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    JsonPipe,
    KtTextField,
    KtTextArea,
    KtNumberField,
    KtSwitch,
    KtCheckbox,
    KtCheckboxGroup,
    KtRadio,
    KtRadioGroup,
    KtSelect,
    KtMultiSelect,
    KtDateField,
    KtTimeField,
    KtDateTimeField,
    KtYearMonthField,
    KtInstantField,
    KtButton,
    DocSection,
    CodeBlock,
    PropsTable,
  ],
  templateUrl: './form-showcase-demo.html',
  styleUrl: './form-showcase-demo.css',
})
export class FormShowcaseDemo {
  // --- Données de présentation (snippets / tableau récap) ---
  protected readonly tsSnippet = SHOWCASE_TS_SNIPPET;
  protected readonly htmlSnippet = SHOWCASE_HTML_SNIPPET;
  protected readonly caps = SHOWCASE_CAPS;
  protected readonly errorModes = SHOWCASE_ERROR_MODES;
  protected readonly errorsSnippet = SHOWCASE_ERRORS_SNIPPET;

  // --- Données d'options ---
  protected readonly countries = ['France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg'];
  protected readonly skillOptions: readonly SkillOption[] = SHOWCASE_SKILLS;

  // --- Le modèle + le formulaire Signal Forms ---
  protected readonly model = signal<ShowcaseModel>(emptyModel());

  protected readonly f = form(this.model, (p) => {
    required(p.civility, { message: 'Civilité requise.' });

    required(p.firstName, { message: 'Prénom requis.' });
    minLength(p.firstName, 2, { message: 'Au moins 2 caractères.' });
    // Pas de `message` ici : la lib affiche le défaut FR (« Ce champ est requis. »), fourni par
    // `provideKtDefaultFR` dans app.config. C'est le filet de sécurité par défaut des erreurs.
    required(p.lastName);

    required(p.username, { message: "Nom d'utilisateur requis." });
    validateAsync(p.username, {
      params: ({ value }) => value().trim().toLowerCase(),
      debounce: 400,
      factory: (params) =>
        resource({
          params: () => params(),
          loader: async ({ params }): Promise<boolean> => {
            const name = params ?? '';
            if (name.length < 2) return false;
            await sleep(700);
            return TAKEN_USERNAMES.includes(name);
          },
        }),
      onSuccess: (taken) => (taken ? { kind: 'taken', message: "Ce nom d'utilisateur est déjà pris." } : undefined),
      onError: () => ({ kind: 'network', message: 'Vérification impossible pour le moment.' }),
      when: ({ value }) => value().trim().length >= 2,
    });

    required(p.email, { message: 'E-mail requis.' });
    email(p.email, { message: 'E-mail invalide.' });

    required(p.password, { message: 'Mot de passe requis.' });
    minLength(p.password, 8, { message: '8 caractères minimum.' });
    pattern(p.password, /(?=.*[A-Z])(?=.*\d)/, { message: 'Au moins une majuscule et un chiffre.' });
    validateTree(p, ({ value, fieldTreeOf }) =>
      value().password === value().confirmPassword
        ? undefined
        : {
            fieldTree: fieldTreeOf(p.confirmPassword),
            kind: 'mismatch',
            message: 'Les mots de passe ne correspondent pas.',
          },
    );

    min(p.age, 18, { message: '18 ans minimum.' });
    max(p.age, 120, { message: 'Âge invalide.' });

    validate(p.birthDate, ({ value }) => {
      const v = value();
      if (v && Temporal.PlainDate.compare(v, Temporal.Now.plainDateISO()) > 0) {
        return { kind: 'future', message: 'La date ne peut pas être dans le futur.' };
      }
      return undefined;
    });

    required(p.country, { message: 'Pays requis.' });
    minLength(p.skills, 1, { message: 'Sélectionnez au moins une compétence.' });

    required(p.contactMethod, { message: 'Choisissez un moyen de contact.' });
    hidden(p.phone, { when: ({ valueOf }) => valueOf(p.contactMethod) !== 'phone' });
    required(p.phone, {
      when: ({ valueOf }) => valueOf(p.contactMethod) === 'phone',
      message: 'Téléphone requis.',
    });
    pattern(p.phone, /^[0-9 +.-]{6,}$/, { message: 'Numéro invalide.' });

    // Idem : message par défaut interpolé avec la limite (« Saisissez au plus 280 caractères. »).
    maxLength(p.bio, 280);

    readonly(p.recordedAt);

    validate(p.acceptTerms, ({ value }) =>
      value() ? undefined : { kind: 'required', message: 'Vous devez accepter les conditions.' },
    );
  });

  // --- Résultat de soumission ---
  protected readonly submitOk = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected async onSubmit(): Promise<void> {
    this.submitOk.set(false);
    this.submitError.set(null);
    const ok = await submit(this.f, {
      action: async () => {
        await sleep(600); // sauvegarde serveur simulée
        return undefined;
      },
      onInvalid: (formTree) => {
        // UX de soumission : focus sur le premier champ invalide.
        formTree().errorSummary()[0]?.fieldTree().focusBoundControl();
      },
    });
    if (ok) this.submitOk.set(true);
    else this.submitError.set('Le formulaire contient des erreurs.');
  }

  protected onReset(): void {
    this.model.set(emptyModel());
    this.f().reset();
    this.submitOk.set(false);
    this.submitError.set(null);
  }

  protected prefill(): void {
    this.model.set(sampleModel());
    this.submitOk.set(false);
    this.submitError.set(null);
  }
}
