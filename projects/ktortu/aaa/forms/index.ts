export { KtField, type KtFieldError } from './field/field';
export { KtFieldControl } from './field/field-control';
export {
  KT_FIELD_CONFIG,
  KT_FIELD,
  type KtFieldParent,
  type KtFieldConfig,
  type KtFieldAppearance,
  type KtFloatLabel,
  type KtFieldErrorMatcher,
  type KtFieldErrorState,
  type KtFieldErrorMessages,
  type KtErrorMessageFactory,
  type KtResolvableError,
  defaultKtFieldErrorMatcher,
  provideKtField,
} from './field/field-config';
export { KtFieldErrorResolver, KT_DEFAULT_FIELD_ERROR_MESSAGES, ktErrorParam } from './field/error-messages';
// Base partagée des champs de saisie simples (point d'extension public, comme les bases Temporal).
export { KtBaseInputField } from './base-input/base-input';
export { KtNumberField } from './number-field/number-field';
export { KtTextArea } from './text-area/text-area';
export { KtTextField, type KtTextFieldType } from './text-field/text-field';
export { KtPasswordField, type KtPasswordAutocomplete } from './password-field/password-field';
export { KtSwitch } from './switch/switch';
export { KtCheckbox } from './checkbox/checkbox';
export { KtCheckboxGroup } from './checkbox/checkbox-group';
export { KtRadio } from './radio/radio';
export { KtRadioGroup } from './radio/radio-group';

// --- Accès partagé options/chips ---
export { type KtKeyish } from './keyish';
export { type KtSuggestion, type KtDatalistOption, normalizeKtSuggestions } from './datalist';

// --- Select (single, v1) ---
// Base partagée single/multi-select (point d'extension public, comme les bases Temporal).
export { KtBaseSelect } from './base-select/base-select';
export { KtSelect, type KtSelectSelectionChange } from './select/select';
export {
  KtSelectOptionDef,
  KtSelectTriggerDef,
  type KtSelectOptionContext,
  type KtSelectTriggerContext,
} from './select/select-option-def';
export { KT_SELECT_CONFIG, DEFAULT_KT_SELECT_CONFIG, type KtSelectConfigOptions } from './select/select-config';
export { KtSelectConfig } from './select/select-config.directive';

// --- Select Multiple ---
export { KtMultiSelect, type KtMultiSelectSelectionChange } from './multi-select/multi-select';
export {
  KtMultiSelectOptionDef,
  KtMultiSelectTriggerDef,
  KtMultiSelectChipDef,
  type KtMultiSelectOptionContext,
  type KtMultiSelectTriggerContext,
  type KtMultiSelectChipContext,
} from './multi-select/multi-select-option-def';

// --- Chips (pilule individuelle + liste révocable) ---
export { KtChip } from './chips/chip';
export { KtChipList } from './chips/chip-list';
export { KtChipItemDef, type KtChipItemContext } from './chips/chip-item-def';
export { KT_CHIPS_CONFIG, type KtChipsConfig } from './chips/chips-config';

// --- Champs Temporal (dates & heures) ---
export { KtBaseTemporalField } from './base-temporal-field';
export { KtBaseTimeTemporalField, type KtTimePrecision } from './base-time-temporal-field';
export { KtDateField } from './date-field/date-field';
export { KtTimeField } from './time-field/time-field';
export { KtDateTimeField } from './date-time-field/date-time-field';
export { KtYearMonthField } from './year-month-field/year-month-field';
export { KtInstantField } from './instant-field/instant-field';
export { KtTemporalDatePipe } from './temporal/temporal-date.pipe';
export { KtClock, KtFixedClock } from './temporal/clock';
export {
  // Runtime `Temporal` (natif ou polyfill) : point d'import unique pour CONSTRUIRE les valeurs
  // passées à `[(value)]`/`min`/`max` (`Temporal.PlainDate.from(...)`), via la même garde que la lib.
  Temporal,
  type TemporalNamespace,
  type CalendarDate,
  type WallTime,
  type LocalDateTime,
  type Timestamp,
  type ZonedTimestamp,
} from './temporal/temporal';
