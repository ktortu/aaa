# Feuille de route — Trous de test @ktortu/aaa

> Audit multi-agents (26 analyses + 26 vérifs adverses + synthèse) du 2026-06-28. Les composants/directives Angular échappent au mutation testing (l'instrumentation casse l'AOT) ; cet audit est leur substitut. Chiffres ci-dessous recalculés depuis les vérificateurs (autoritatifs).

## 1. Résumé chiffré (245 trous confirmés, 25 composants)

| Sévérité    | Nombre | Part |
| ----------- | ------ | ---- |
| a11y        | 110    | 45 % |
| correctness | 81     | 33 % |
| edge        | 54     | 22 % |

| Composant          | Total | a11y | correctness | edge |
| ------------------ | ----- | ---- | ----------- | ---- |
| text-area          | 17    | 8    | 4           | 5    |
| date-time-field    | 16    | 8    | 6           | 2    |
| text-field         | 14    | 5    | 4           | 5    |
| number-field       | 14    | 7    | 4           | 3    |
| dialog             | 14    | 7    | 4           | 3    |
| field              | 13    | 6    | 6           | 1    |
| year-month-field   | 13    | 7    | 5           | 1    |
| radio              | 12    | 4    | 4           | 4    |
| button             | 11    | 7    | 2           | 2    |
| checkbox           | 11    | 6    | 4           | 1    |
| checkbox-group     | 11    | 6    | 2           | 3    |
| select             | 10    | 5    | 2           | 3    |
| tooltip            | 10    | 3    | 4           | 3    |
| multi-select       | 10    | 4    | 3           | 3    |
| chip-list          | 8     | 4    | 2           | 2    |
| tab-scroller       | 8     | 0    | 4           | 4    |
| switch             | 8     | 3    | 4           | 1    |
| menu               | 7     | 3    | 3           | 1    |
| time-field         | 7     | 4    | 3           | 0    |
| tab-scroller-pager | 7     | 4    | 2           | 1    |
| card               | 6     | 3    | 2           | 1    |
| date-field         | 6     | 2    | 2           | 2    |
| chip               | 4     | 2    | 1           | 1    |
| tab-scroll         | 4     | 1    | 2           | 1    |
| instant-field      | 4     | 1    | 2           | 1    |

## 2. Tableau priorisé des trous a11y critiques

Priorité aux invariants ARIA observables en DOM qui cassent silencieusement pour les lecteurs d'écran.

| #   | Composant              | Comportement                                                                           | Assertion à ajouter                                                                                   |
| --- | ---------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | checkbox               | `aria-describedby` input → hintId, puis bascule → errorId en erreur                    | `expect(input().getAttribute('aria-describedby')).toBe(hintEl.id)` ; après erreur `.toBe(errorEl.id)` |
| 2   | checkbox-group         | `aria-describedby` groupe hint→error + hint masqué en erreur                           | groupe invalide+touched+hint : `aria-describedby === error.id` ET `__hint === null`                   |
| 3   | radio                  | `aria-invalid='true'` posé sur le radiogroup quand showInvalid, null tant que !touched | `group.getAttribute('aria-invalid')` true/null selon touched                                          |
| 4   | radio                  | `aria-describedby` du groupe → errorId/hintId (distinct du hint par-option)            | `group.getAttribute('aria-describedby')` contient errorId en erreur                                   |
| 5   | switch                 | bouton role=switch n'expose jamais `aria-describedby` (hint→error)                     | `button().getAttribute('aria-describedby')` === hint.id puis error.id                                 |
| 6   | switch                 | `aria-required='true'` sur le bouton role=switch, null si false                        | `button().getAttribute('aria-required')` true/null                                                    |
| 7   | text-field / text-area | `aria-describedby` input → hint et/ou erreur jamais asserté                            | en erreur : `aria-describedby` contient `.kt-field__error` id                                         |
| 8   | text-field / text-area | association `label[for] === input.id` jamais vérifiée                                  | `expect(label.getAttribute('for')).toBe(input().id)`                                                  |
| 9   | field                  | région d'erreur live `aria-live="polite"` présente même hors erreur                    | état initial : conteneur `.kt-field__error` truthy + `aria-live='polite'`                             |
| 10  | field                  | `aria-required`/`aria-invalid` **retirés** (pas `'false'`) par défaut                  | `input().hasAttribute('aria-required')).toBe(false)`                                                  |
| 11  | select                 | `data-invalid` sur trigger + `aria-describedby` trigger→hint/error                     | host invalid+touched : `trigger.getAttribute('data-invalid')).toBe('')`                               |
| 12  | select                 | options désactivées : `aria-disabled='true'` sur `<li>` + non-commit                   | popup ouvert : `li[Grace].getAttribute('aria-disabled')).toBe('true')`                                |
| 13  | multi-select           | mode panneau : `role='dialog'` + `aria-label` + filtre `aria-controls=lb.id`           | `panel.getAttribute('role')).toBe('dialog')`                                                          |
| 14  | button                 | priorité input `ariaLabel` SUR aria-label natif quand les deux présents                | host avec les deux → `button.getAttribute('aria-label')).toBe('input')`                               |
| 15  | button                 | `aria-busy` ABSENT quand loading=false (seul true est testé)                           | défaut : `button.hasAttribute('aria-busy')).toBe(false)`                                              |
| 16  | dialog                 | `aria-modal="true"` posé en DOM sur le conteneur                                       | e2e : `container).toHaveAttribute('aria-modal','true')`                                               |
| 17  | dialog                 | `aria-describedby` réellement en DOM pointant le `ktDialogDescription` visible         | e2e : descId contient `kt-dialog-desc-` + cible visible                                               |
| 18  | dialog                 | restitution focus au trigger après fermeture scrim ET Escape                           | `expect(trigger).toBeFocused()` après chaque                                                          |
| 19  | menu                   | item à état désactivé : clic/clavier ne bascule pas (`aria-checked` figé)              | checkbox/radio disabled sur vrai `[ngMenuItem]` → `aria-checked` reste 'false'                        |
| 20  | tooltip                | `aria-describedby` retiré du trigger après fermeture (pas seulement disabled/vide)     | après mouseleave+hideDelay : `trigger.hasAttribute('aria-describedby')).toBe(false)`                  |

---

## 3. Patterns récurrents

1. **Hosts de test sous-câblés (cause racine n°1, ~60 trous).** Les composants temporels et de champ déclarent des hosts qui ne bindent que `value/label/clearable`. Tout l'espace `disabled/readonly/required/invalid/touched/errors/pending/min/max/name/precision/suggestions` est inatteignable depuis le template. → **Fix structurel : enrichir les hosts existants** (un seul host paramétrable par composant) débloque 5-10 trous d'un coup.

2. **État interne asserté au lieu du DOM observable.** Récurrent sur `number-field` (assertions sur `host.value()` / `rawValue.parseErrors()` au lieu de `aria-valuenow`, `aria-invalid`, `role=spinbutton`), `dialog` (assertions sur `config.aria*` au lieu de l'attribut DOM ; `KtDialogContainer` jamais monté), `switch`/`radio` (`.touched` du modèle jamais lu). → La régression DOM passe inaperçue.

3. **Valeurs par défaut neutres (i18n) jamais exercées.** Les hosts forcent toujours une surcharge FR/custom, masquant le défaut EN : `chip.removeLabel='Remove'`, `field.helpLabel='Help'`, `tooltip.showDelay=150/hideDelay=100`, `clearLabel='Clear'`, messages d'erreur EN par défaut (`'This field is required.'`). La cascade `input ?? config ?? défaut` n'a sa branche **config** (`KT_*_CONFIG`/`provideKt*`) testée nulle part (field, tooltip, select truncated).

4. **Focus jamais inspecté.** Aucun `document.activeElement` après `clear()` (tous les champs temporels + text-area), aucun test d'**absence** de vol de focus au montage (card). Le refocus post-clear et la restitution de focus dialog (scrim/Escape) sont câblés mais non gardés.

5. **`aria-hidden` des décoratifs jamais asserté.** Astérisque requis, icône d'aide, icône `close` du chip, icône de champ : tous `aria-hidden="true"` dans le template, aucun ne le vérifie → une régression annoncerait "Remove X close" ou lirait l'astérisque.

6. **Branche positive vs négative.** Souvent seul le cas "actif/présent" est testé : `aria-busy=true` mais jamais absent ; `aria-expanded=false` mais jamais `true` après ouverture (chip-list) ; clic disabled jamais effectué pour prouver le no-op (chip, checkbox-group `toggle`, menu, radio `select`).

7. **Clavier sous-testé.** `Escape` pour vider (tous les champs + text-area), `Spacebar`/`Enter` sur switch/menu désactivés, navigation flèches vers le bouton "+N more" (chip-list), activation clavier radio menu : tous câblés, jamais dispatchés en unit.

8. **`blur` → touched isolé.** Le passage non-touché→blur→erreur visible n'est jamais démontré en deux temps (checkbox, switch, text-field, text-area, date-field, year-month-field) ; `touched` n'est atteint qu'en passant par `click()`.

9. **Branches RTL / verticale entièrement mortes.** `tab-scroller`/`tab-scroller-pager` : `getComputedStyle().direction='rtl'` jamais mocké → `measure()` RTL, `scrollByPage` RTL, icônes RTL/verticales (`expand_less/more`, `chevron_right/left`) non exécutés.

---

## 4. Top 15 des gardes à écrire EN PREMIER (par ROI)

Critère : sévérité a11y/correctness × nombre de trous débloqués par le même setup × invariant silencieux.

| #   | Composant                            | Garde (assertion observable précise)                                                                                                                                                                                                                                    | ROI                                                          |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- | ----------------------- |
| 1   | **field** (mutualisé)                | Enrichir FieldHost avec `appearance/floatLabel/required/invalid/touched/hint/errors/helpText` puis asserter : `data-appearance='fill'` défaut, `aria-describedby` ordre `[hint,error,tooltip,custom]` via split, `aria-required`/`aria-invalid` **absents** par défaut. | Débloque ~9 trous field + propage le pattern aux champs      |
| 2   | **dialog**                           | Monter `KtDialogContainer` en unit (jamais fait) → `container.getAttribute('aria-modal')==='true'`, `aria-describedby` présent/nettoyé, warn "sans nom accessible".                                                                                                     | Débloque 6 trous, tous le même setup manquant                |
| 3   | **checkbox**                         | `aria-describedby` input bascule hint→errorId + `.kt-checkbox-error` `aria-live='polite'`.                                                                                                                                                                              | a11y silencieux, 2 trous                                     |
| 4   | **radio**                            | radiogroup : `aria-invalid` selon touched + `aria-describedby`→errorId + `select()` no-op si disabled (value/touched inchangés).                                                                                                                                        | 3 trous, garde de commit critique                            |
| 5   | **switch**                           | `aria-describedby` (hint→error), `aria-required`, et toggle inerte au Spacebar si disabled.                                                                                                                                                                             | 3 trous a11y/correctness                                     |
| 6   | **button**                           | host combinant aria-label natif + input → input gagne ; `aria-busy` absent si !loading ; tabindex jamais posé sur `<button>` disabled.                                                                                                                                  | 3 trous a11y, régressions ARIA                               |
| 7   | **menu**                             | checkbox/radio sur **vrai** `[ngMenuItem][disabled]` → `aria-checked` figé au clic ET keydown Enter/Space ; `preventDefault()` (defaultPrevented===true).                                                                                                               | 3 trous, branche `ariaItem?.disabled()` jamais atteinte      |
| 8   | **select**                           | popup ouvert : `aria-disabled='true'` sur l'option Grace + `onListboxValueChange([3])` ne mute pas value/n'émet pas.                                                                                                                                                    | a11y + correctness, branche disabledOf morte                 |
| 9   | **multi-select**                     | host `[invalid][touched][errors]` → `trigger[data-invalid]==''` + message rendu + id dans `aria-describedby` ; idem `[pending]`→`aria-busy`.                                                                                                                            | 2 trous a11y, hosts absents                                  |
| 10  | **text-field/text-area** (mutualisé) | `label[for]===input.id` + `aria-describedby`→error + `Escape` vide (clearable) `defaultPrevented===true` + refocus.                                                                                                                                                     | Débloque ~6 trous communs aux deux                           |
| 11  | **chip / chip-list**                 | `.kt-chip__close-icon[aria-hidden='true']` + e2e `getByRole('button',{name:/^Retirer X$/})` exact ; `aria-expanded='true'` après `more.click()`.                                                                                                                        | empêche "Retirer X close" qui matche encore                  |
| 12  | **number-field**                     | `role='spinbutton'` + `aria-valuenow` après ArrowUp + flèches inertes si `disabled                                                                                                                                                                                      |                                                              | readonly`. | DOM vs interne, 3 trous |
| 13  | **temporal (mutualisé)**             | Helper host paramétrable : pour chaque champ asserter clic clear → `document.activeElement===input()` + `aria-label` du bouton clear + `Escape` vide.                                                                                                                   | Débloque le focus/clear sur 4-5 champs                       |
| 14  | **tooltip**                          | défaut showDelay 150 (149 absent / 150 présent) + `aria-describedby` retiré après mouseleave + `popover='manual'`.                                                                                                                                                      | défauts i18n + a11y, 3 trous                                 |
| 15  | **tab-scroller-pager**               | mock `getComputedStyle().direction='rtl'` → icônes `chevron_right/left` + orientation verticale `expand_less/more` + `data-orientation='vertical'`.                                                                                                                     | débloque toutes les branches RTL/verticale mortes (≥6 trous) |

**Recommandation transverse :** prioriser #1, #2, #10, #13 — ce sont des **refactors de host** qui débloquent chacun plusieurs trous simultanément, plutôt que des tests one-shot. ROI le plus élevé du lot.

Fichiers concernés (chemins absolus) : `C:\dev\aaa\projects\ktortu\aaa\{button,card,checkbox,chip,field,date-field,date-time-field,instant-field,time-field,year-month-field,number-field,text-field,text-area,switch,radio,select,multi-select,menu,tooltip,tabs,dialog}\*.spec.ts`.

---

# Détail par composant

## text-area (17)

- **[a11y]** Disabled : la textarea native reçoit l'attribut disabled et le conteneur .kt-field-box reçoit data-disabled.
  - source: `text-area.html:19,44 ; base-input.ts:53`
  - assert: host.disabled=true; fixture.detectChanges(); expect(textarea().disabled).toBe(true); expect(el.querySelector('.kt-field-box')!.getAttribute('data-disabled')).toBe('');
  - preuve: Le host de text-area.spec.ts (l.8-16, classe l.19-27) ne déclare ni ne lie [disabled] ; aucun des 7 tests (l.52-102) ne touche disabled. Absent.
- **[a11y]** Readonly : la textarea native reçoit l'attribut readOnly (valeur visible, non modifiable).
  - source: `text-area.html:45 ; base-input.ts:55`
  - assert: host.readonly=true; fixture.detectChanges(); expect(textarea().readOnly).toBe(true);
  - preuve: readonly n'est ni une propriété du host (l.19-27) ni lié dans le template (l.8-16) ; aucun test ne le mentionne. Absent.
- **[a11y]** État invalide : aria-invalid='true' sur la textarea (via ktFieldControl) et data-invalid sur le conteneur quand showInvalid().
  - source: `field-control.ts:18 ; text-area.html:19 ; base-input.ts:116-118`
  - assert: host.invalid=true; host.touched=true; fixture.detectChanges(); expect(textarea().getAttribute('aria-invalid')).toBe('true'); expect(el.querySelector('.kt-field-box')!.getAttribute('data-invalid')).toBe('');
  - preuve: Ni invalid ni touched ne sont exposés par le host ni liés (l.8-27) ; le matcher défaut (invalid && touched) n'est jamais déclenché dans les tests l.52-102. Absent.
- **[a11y]** Champ requis : aria-required='true' posé sur la textarea via ktFieldControl.
  - source: `field-control.ts:19 ; field.ts:74 ; base-input.ts:59`
  - assert: host.required=true; fixture.detectChanges(); expect(textarea().getAttribute('aria-required')).toBe('true');
  - preuve: required absent du host (l.19-27) et du template (l.8-16) ; aucun test ne vérifie aria-required. Absent.
- **[a11y]** aria-describedby de la textarea pointe vers le hint quand valide et inclut l'erreur quand invalide.
  - source: `field-control.ts:17 ; field.ts:131-147 ; text-area.html:3,7`
  - assert: Avec hint: expect(textarea().getAttribute('aria-describedby')).toContain(el.querySelector('[id$="-hint"]')!.id). En erreur: expect(textarea().getAttribute('aria-describedby')).toContain(el.querySelector('[id$="-error"]')!.id);
  - preuve: Le host ne lie ni [hint] ni [errors] (l.8-16) et ne les déclare pas (l.19-27) ; aucun test n'inspecte aria-describedby. Absent.
- **[a11y]** Blur marque le champ touché, déclenchant l'affichage de l'erreur (matcher défaut invalid && touched) et l'apparition du message dans le DOM.
  - source: `text-area.html:55 ; base-input.ts:116-117`
  - assert: host.invalid=true + errors fournis; textarea().dispatchEvent(new Event('blur')); fixture.detectChanges(); expect(el.querySelector('[id$="-error"]')!.textContent).toContain(<message>); expect(textarea().getAttribute('aria-invalid')).toBe('true');
  - preuve: Aucun test ne dispatch d'événement 'blur' (les tests l.72-77 dispatchent seulement 'input') ; touched/invalid/errors ne sont jamais fournis. Absent.
- **[a11y]** Bouton clear expose un aria-label accessible — par défaut 'Clear'.
  - source: `text-area.html:59 ; base-input.ts:99`
  - assert: host.clearable=true; host.value='x'; fixture.detectChanges(); expect(clearButton()!.getAttribute('aria-label')).toBe('Clear');
  - preuve: Le test l.94-102 clique le bouton mais n'inspecte jamais son aria-label. Absent.
- **[a11y]** Icône rendue en tête de champ avec aria-hidden='true' (décorative).
  - source: `text-area.html:23-25`
  - assert: host.icon='edit'; fixture.detectChanges(); const i=el.querySelector('.kt-field-box\_\_icon'); expect(i!.textContent!.trim()).toBe('edit'); expect(i!.getAttribute('aria-hidden')).toBe('true');
  - preuve: icon jamais lié dans le host (l.8-27) ; aucun test ne sélectionne .kt-field-box\_\_icon ni ne vérifie aria-hidden. Absent.
- **[correctness]** Touche Échap efface la valeur quand le bouton clear est visible (et appelle preventDefault) ; ne fait rien sinon.
  - source: `base-input.ts:158-163 ; text-area.html:53`
  - assert: host.clearable=true; host.value='x'; fixture.detectChanges(); const ev=new KeyboardEvent('keydown',{key:'Escape',cancelable:true}); textarea().dispatchEvent(ev); fixture.detectChanges(); expect(host.value()).toBe(''); expect(ev.defaultPrevented).toBe(true);
  - preuve: Le seul test de clear (l.94-102) passe par clearButton().click() ; aucun dispatch de keydown Escape, le chemin onKeyDown n'est pas exercé. Absent.
- **[correctness]** maxLength pousse l'attribut natif maxlength ; son absence laisse l'attribut absent (branche ?? null).
  - source: `text-area.ts:31 ; text-area.html:51`
  - assert: host.maxLength=200; fixture.detectChanges(); expect(textarea().getAttribute('maxlength')).toBe('200'); puis défaut: expect(textarea().hasAttribute('maxlength')).toBe(false);
  - preuve: maxLength n'est ni déclaré dans le host ni lié (l.8-27) ; seul minlength est testé (l.79-85). Aucune assertion sur maxlength. Absent.
- **[correctness]** Bouton clear masqué quand le champ est disabled ou readonly même si clearable et non vide (gate showClear).
  - source: `base-input.ts:123-125`
  - assert: host.clearable=true; host.value='x'; host.disabled=true; fixture.detectChanges(); expect(clearButton()).toBeNull(); idem avec readonly=true.
  - preuve: disabled et readonly ne sont ni déclarés ni liés par le host (l.8-27) ; le seul test clear (l.94-102) ne croise jamais ces états. Absent.
- **[correctness]** Placeholder natif posé sur la textarea (apparence fill : valeur telle quelle).
  - source: `base-input.ts:140-144 ; text-area.html:48`
  - assert: host.placeholder='Votre bio'; fixture.detectChanges(); expect(textarea().getAttribute('placeholder')).toBe('Votre bio');
  - preuve: placeholder n'est ni déclaré dans le host ni lié (l.8-27) ; aucun test n'inspecte l'attribut placeholder. Absent.
- **[edge]** patternAttr : tableau vide ⇒ attribut pattern absent (branche null) ; tableau multi-regex ⇒ seule la première regex est posée.
  - source: `text-area.ts:36 ; text-area.html:52`
  - assert: host.pattern=[]; fixture.detectChanges(); expect(textarea().hasAttribute('pattern')).toBe(false). Multi: host.pattern=[/a/,/b/]; fixture.detectChanges(); expect(textarea().getAttribute('pattern')).toBe('a');
  - preuve: Le seul test pattern (l.79-85) fixe [/.+/] (mono-regex) puis vérifie 'pattern'='.+'. Aucune assertion sur hasAttribute('pattern')===false pour le cas vide (le défaut [] n'est jamais asserté), ni sur l
- **[edge]** Attribut name natif présent quand fourni, absent sinon (branche || null).
  - source: `text-area.html:47 ; base-input.ts:67`
  - assert: host.name='bio'; fixture.detectChanges(); expect(textarea().getAttribute('name')).toBe('bio'); défaut: expect(textarea().hasAttribute('name')).toBe(false);
  - preuve: name absent du host (l.19-27) et du template (l.8-16) ; aucun test sur l'attribut name. Absent.
- **[edge]** Attribut autocomplete natif transmis à la textarea quand fourni.
  - source: `text-area.html:49 ; base-input.ts:89`
  - assert: host.autocomplete='off'; fixture.detectChanges(); expect(textarea().getAttribute('autocomplete')).toBe('off');
  - preuve: autocomplete jamais déclaré/lié dans le spec (l.8-27) ; aucune assertion. Absent.
- **[edge]** Prefix/suffix rendus comme texte (asText) dans les slots affixe.
  - source: `text-area.html:27-35,64-72 ; base-input.ts:146-152`
  - assert: host.prefix='@'; fixture.detectChanges(); expect(el.querySelector('.kt-field-box\_\_affix')!.textContent!.trim()).toBe('@');
  - preuve: prefix/suffix absents du host (l.8-27) ; aucun test ne sélectionne .kt-field-box\_\_affix. Absent.
- **[edge]** reset() ré-aligne la valeur affichée de la textarea native sur value() (chemin Signal Forms reset).
  - source: `base-input.ts:171-174`
  - assert: host.value='abc'; fixture.detectChanges(); textarea().value='modifié à la main'; (debugEl.query(By.directive(KtTextArea)).componentInstance as KtTextArea).reset(); expect(textarea().value).toBe('abc');
  - preuve: reset() n'est jamais appelé dans le spec ; aucun accès à l'instance KtTextArea n'est fait (les tests passent par le host et le DOM uniquement). Absent.

## date-time-field (16)

- **[a11y]** Association programmatique label↔input (label[for] cible l'id de l'input, ou getByLabelText) jamais assertée pour kt-date-time-field.
  - source: `date-time-field.html:1-10 ([label]+[fieldId]=id()) ; spec:8 (host passe [label]) ; e2e temporal.spec.ts:17,19`
  - assert: expect(input().getAttribute('id')).toBeTruthy(); const lbl=el.querySelector('label'); expect(lbl?.getAttribute('for')).toBe(input().getAttribute('id')); expect(lbl?.textContent).toContain('Rendez-vous')
  - preuve: Le host (spec:8) ne lie que [(value)]/[label]/[clearable] ; aucun test ne lit input().id ni label[for]. En e2e, getByLabel n'est utilisé que sur kt-date-field (ligne 17 'Pré-remplie') ; la ligne 19 ci
- **[a11y]** required → aria-required='true' non asserté pour date-time-field.
  - source: `date-time-field.html:9 ([required]=required()) ; base-input.ts:59`
  - assert: host [required]=true → expect(input().getAttribute('aria-required')).toBe('true')
  - preuve: Le host (spec:8) ne lie pas [required] (impossible à activer depuis ce template) ; aucune assertion aria-required dans le spec. En e2e, aria-required n'est vérifié que sur kt-date-field 'Requis' (lign
- **[a11y]** invalid+touched → aria-invalid='true' + région d'erreur (displayErrors) non assertés pour date-time-field.
  - source: `date-time-field.html:7,8,18 (displayErrors/showInvalid → [invalid]+data-invalid) ; base-input.ts:116-118`
  - assert: host [invalid]=true [touched]=true [errors]=[{kind:'x',message:'Erreur'}] → expect(input().getAttribute('aria-invalid')).toBe('true'); expect(el.textContent).toContain('Erreur')
  - preuve: Le host ne lie ni [invalid] ni [touched] ni [errors] ; aucune assertion aria-invalid/erreur dans le spec. En e2e, aria-invalid n'est testé que sur kt-date-field 'Échéance' (lignes 35-37).
- **[a11y]** disabled : attribut natif disabled + data-disabled, et masquage de la croix (showClear exclut disabled) non assertés.
  - source: `date-time-field.html:19,41 ([disabled]+data-disabled) ; base-input.ts:53,123-124 (showClear !disabled)`
  - assert: host [disabled]=true → expect(input().disabled).toBe(true); avec clearable+value+disabled → expect(el.querySelector('.kt-field-box\_\_clear')).toBeNull()
  - preuve: Le host ne lie pas [disabled] ; aucune assertion sur input().disabled ni .kt-field-box[data-disabled]. En e2e, disabled n'est testé que sur kt-date-field 'Désactivé' (ligne 31).
- **[a11y]** readonly : attribut natif readOnly et masquage de la croix (showClear exclut readonly) non assertés.
  - source: `date-time-field.html:42 ([readOnly]=readonly()) ; base-input.ts:55,123-124`
  - assert: host [readonly]=true → expect(input().readOnly).toBe(true); avec clearable+value+readonly → bouton clear absent
  - preuve: Le host ne lie pas [readonly] ; aucune assertion sur input().readOnly. En e2e, readonly n'est testé que sur kt-date-field 'Lecture seule' (ligne 32).
- **[a11y]** clear() redonne le focus à l'input ; le test clearable vérifie value=null et input vidé mais pas document.activeElement.
  - source: `base-input.ts:182-186 (clear→focus) ; base-temporal-field.ts:76-80`
  - assert: après clic sur .kt-field-box\_\_clear → expect(document.activeElement).toBe(input())
  - preuve: Le test clearable (spec:61-71) n'assert que host.value()===null (69) et input().value==='' (70) ; document.activeElement n'apparaît nulle part dans le spec.
- **[a11y]** aria-label du bouton clear (clearLabel) non asserté ; seules présence et effet du bouton sont vérifiés.
  - source: `date-time-field.html:64 ([attr.aria-label]=clearLabel()) ; base-input.ts:99`
  - assert: expect(el.querySelector('.kt-field-box\_\_clear')?.getAttribute('aria-label')).toBeTruthy() (= clearLabel attendu)
  - preuve: Le test clearable (spec:65-67) sélectionne le bouton par classe '.kt-field-box\_\_clear' et vérifie seulement clearBtn truthy + l'effet du clic ; aucune lecture de getAttribute('aria-label') ni getByRol
- **[a11y]** pending → aria-busy='true' sur l'input + data-pending sur .kt-field-box non assertés ; branche pending=false (attribut absent) non vérifiée.
  - source: `date-time-field.html:20,43 (data-pending ; aria-busy) ; base-input.ts:63`
  - assert: host [pending]=true → expect(input().getAttribute('aria-busy')).toBe('true') et .kt-field-box[data-pending] présent
  - preuve: Le host ne lie pas [pending] ; aucune occurrence de aria-busy/pending dans date-time-field.spec.ts ni temporal.spec.ts.
- **[correctness]** precision='second' : sérialisation à la seconde ET attribut natif step='1' jamais assertés pour date-time-field (seul le cas minute est testé).
  - source: `date-time-field.ts:38 (smallestUnit:precision()) ; base-time-temporal-field.ts:32 (step '1' si second) ; date-time-field.html:48`
  - assert: host precision='second' + value PlainDateTime '...T14:00:30' → expect(input().value).toBe('2026-06-08T14:00:30'); expect(input().getAttribute('step')).toBe('1')
  - preuve: Le host ne lie pas [precision] ; le seul test de sérialisation (spec:39-42) vérifie la précision MINUTE ('drops seconds', résultat '2026-06-08T14:00'). En e2e, precision='second' n'est couvert que pou
- **[correctness]** step par défaut (precision='minute') doit être ABSENT du DOM (step() → null) ; jamais asserté.
  - source: `base-time-temporal-field.ts:29,32 (null si minute) ; date-time-field.html:48 ([attr.step]=step())`
  - assert: par défaut : expect(input().hasAttribute('step')).toBe(false)
  - preuve: Aucune occurrence de 'step' dans date-time-field.spec.ts ni dans temporal.spec.ts ; la présence/absence de l'attribut step n'est vérifiée nulle part.
- **[correctness]** Bornes min/max : attributs natifs min/max (serializedMin/serializedMax) jamais assertés, ni la branche non bornée (attribut absent).
  - source: `date-time-field.html:46-47 ([min]=serializedMin() [max]=serializedMax()) ; base-temporal-field.ts:98-106`
  - assert: host [min]=PlainDateTime.from('2026-01-01T00:00') → expect(input().getAttribute('min')).toBe('2026-01-01T00:00'); sans min → expect(input().hasAttribute('min')).toBe(false)
  - preuve: Le host ne lie ni [min] ni [max] ; aucune occurrence de min/max dans le spec ni dans temporal.spec.ts (absent unitaire ET e2e).
- **[correctness]** Parsing tolérant : saisie invalide → null SANS exception (branche catch de parse) jamais exercée ; seuls valeur valide et chaîne vide sont testés.
  - source: `base-temporal-field.ts:57-65 (try/catch → null) ; date-time-field.ts:33 (PlainDateTime.from lève sur invalide)`
  - assert: input().value='2026-99-99T99:99'; dispatch input → expect(host.value()).toBeNull() (sans exception)
  - preuve: Le spec ne couvre que la saisie valide (spec:45-49) et la chaîne vide (spec:52-58) ; aucune valeur invalide n'est injectée, donc la branche catch (fromString lève) n'est jamais déclenchée.
- **[correctness]** Échap efface le champ (onKeyDown Escape→clear) non testé en unitaire pour date-time-field ; branche showClear()=false (no-op) aussi non couverte.
  - source: `base-input.ts:158-163 (Escape→clear) ; date-time-field.html:51 ((keydown)=onKeyDown)`
  - assert: clearable+value, dispatch keydown Escape sur input → expect(host.value()).toBeNull() && expect(input().value).toBe('')
  - preuve: Aucun dispatch de KeyboardEvent('keydown') dans date-time-field.spec.ts (le test clearable spec:61-71 passe par clearBtn.click()). En e2e, l'effacement n'est testé que sur kt-date-field via getByRole(
- **[correctness]** Suggestions/datalist : [attr.list] sur l'input + <datalist> d'options sérialisées non testés pour date-time-field (sérialisation datetime-local des suggestions jamais vérifiée).
  - source: `date-time-field.html:49,55-61 ([list], datalist) ; base-temporal-field.ts:111-119`
  - assert: host [suggestions]=[PlainDateTime.from('2026-06-08T09:00')] → [list] défini sur l'input ; option[value='2026-06-08T09:00'] présente dans le datalist
  - preuve: Le host ne lie pas [suggestions] ; aucune occurrence de datalist/list dans date-time-field.spec.ts. En e2e, le test datalist (lignes 48-54) cible input[type=month] (year-month-field), jamais datetime-
- **[edge]** Garde de l'effet de synchro input↔valeur quand l'input est focalisé et val===null (ne pas écraser une saisie partielle) jamais exercée.
  - source: `base-temporal-field.ts:39-49 (garde !isFocused || val!==null)`
  - assert: focus input, saisie partielle dans l'input, set programmatique value=null → l'effet ne doit pas réécrire/effacer la saisie en cours
  - preuve: Aucun test du spec ne met l'input en focus (document.activeElement) avant un set programmatique de value à null ; la condition isFocused && val===null n'est jamais atteinte.
- **[edge]** name natif : [attr.name]=name()||null (pose/omet l'attribut) non testé, ni la branche name vide → attribut absent.
  - source: `date-time-field.html:44 ([attr.name]=name()||null) ; base-input.ts:67`
  - assert: host [name]='startsAt' → expect(input().getAttribute('name')).toBe('startsAt'); sans name → expect(input().hasAttribute('name')).toBe(false)
  - preuve: Le host ne lie pas [name] ; aucune occurrence de 'name' (attribut natif) dans date-time-field.spec.ts ni temporal.spec.ts.

## text-field (14)

- **[a11y]** aria-required natif (et astérisque visuel) jamais asserté quand required est vrai ; l'input required n'est jamais lié dans TextFieldHost.
  - source: `field-control.ts:19 ([attr.aria-required]) ; field.html:5-7 (astérisque) ; base-input.ts:59 (required)`
  - assert: Avec required=true : expect(input().getAttribute('aria-required')).toBe('true') et expect(el.querySelector('.kt-field\_\_required')).toBeTruthy() ; sans required : aria-required null.
  - preuve: TextFieldHost (text-field.spec.ts:10-22) ne bind PAS [required] et la classe (l.25-37) ne déclare aucun signal required ; aucune occurrence de 'aria-required' ni '.kt-field\_\_required' dans le spec.
- **[a11y]** Association label↔input via for/id jamais assertée ; le test 'renders an input and a label' vérifie seulement le textContent du label.
  - source: `field.html:3 ([for]=baseId()) ; field-control.ts:16,25 ([id]=baseId) ; field.ts:116 (baseId)`
  - assert: const lbl = el.querySelector('label'); expect(input().id).toBeTruthy(); expect(lbl.getAttribute('for')).toBe(input().id).
  - preuve: text-field.spec.ts:62-65 n'asserte que `el.querySelector('label')?.textContent` ; aucune lecture de input().id ni de l'attribut 'for' dans tout le spec.
- **[a11y]** aria-describedby pointant vers le hint et/ou l'erreur jamais asserté, même dans 'marks invalid and shows the error after blur'.
  - source: `field.ts:131-147 (describedBy) ; field-control.ts:17 ([attr.aria-describedby]) ; field.html:32 hintId, 36 errorId`
  - assert: En erreur affichée : expect(input().getAttribute('aria-describedby')).toContain(el.querySelector('.kt-field**error').id). Avec hint : doit contenir l'id du .kt-field**hint.
  - preuve: Aucune occurrence de 'aria-describedby' ni de '.kt-field\_\_hint' dans le spec ; [hint] n'est pas bindé dans TextFieldHost (l.10-22), donc même le chemin hint est inactif et non vérifié.
- **[a11y]** État disabled non testé : ni disabled natif sur l'input, ni data-disabled sur .kt-field-box, ni la suppression du bouton clear.
  - source: `base-input.ts:53 (disabled), 123-125 (showClear) ; text-field.html:19 (data-disabled), 42 ([disabled])`
  - assert: Avec disabled+clearable+valeur : expect(input().disabled).toBe(true) ; expect(el.querySelector('.kt-field-box').getAttribute('data-disabled')).toBe('') ; expect(clearButton()).toBeNull().
  - preuve: TextFieldHost ne déclare ni ne bind 'disabled' (l.25-37) ; aucune occurrence de 'disabled' ni 'data-disabled' dans le spec.
- **[a11y]** État readonly non testé : ni readOnly natif sur l'input, ni la suppression du clear.
  - source: `base-input.ts:55 (readonly), 123-125 (showClear) ; text-field.html:43 ([readOnly])`
  - assert: Avec readonly+clearable+valeur : expect(input().readOnly).toBe(true) ; expect(clearButton()).toBeNull().
  - preuve: Aucune occurrence de 'readonly'/'readOnly' dans le spec ; non bindé dans TextFieldHost.
- **[correctness]** Attribut type natif jamais asserté (ni défaut 'text' ni variante email/etc.).
  - source: `text-field.ts:32 (type input) ; text-field.html:40 ([type])`
  - assert: Par défaut expect(input().getAttribute('type')).toBe('text') ; type='email' ⇒ expect(input().type).toBe('email').
  - preuve: Aucune occurrence de '.type' ni de getAttribute('type') dans le spec ; [type] non bindé dans TextFieldHost (l.10-22).
- **[correctness]** Raccourci Échap pour vider (onKeyDown) non testé : Escape doit preventDefault + vider quand showClear est vrai, sinon ne rien faire.
  - source: `base-input.ts:158-163 (onKeyDown) ; text-field.html:52 ((keydown))`
  - assert: clearable+valeur 'x' : dispatch KeyboardEvent('keydown',{key:'Escape'}) ⇒ host.value()==='' et activeElement===input(). Sans clearable : valeur inchangée.
  - preuve: Seul le clic sur clearButton est testé (text-field.spec.ts:90-98) ; aucune occurrence de 'KeyboardEvent', 'keydown' ou 'Escape' dans le spec.
- **[correctness]** Fonctionnalité suggestions/datalist entièrement non testée : <datalist>, attribut list, options value/label, absence de list sans suggestion.
  - source: `text-field.ts:45-51 (suggestions, hasSuggestions, datalistOptions) ; text-field.html:51 ([attr.list]), 57-63 (datalist/options)`
  - assert: Sans suggestions : input().getAttribute('list') null, pas de <datalist>. Avec [{value:'a',label:'Alpha'}] : list===datalist.id ; options.length===1 ; option.value==='a' ; option.getAttribute('label')==='Alpha'.
  - preuve: Aucune occurrence de 'datalist', 'list' ou 'suggestions' dans le spec ; [suggestions] non bindé dans TextFieldHost.
- **[correctness]** Le blur seul (champ valide) posant touched n'est pas isolé : touched n'est observé que conjointement à invalid.
  - source: `text-field.html:54 ((blur)=touched.set(true)) ; base-input.ts:116-118 (showInvalid dépend de touched)`
  - assert: Poser invalid+errors sans toucher ⇒ aria-invalid absent ; puis dispatch 'blur' seul ⇒ expect(input().getAttribute('aria-invalid')).toBe('true'), démontrant que blur (touched) déclenche l'affichage.
  - preuve: Le seul blur du spec (l.167) est dispatché APRÈS avoir posé invalid+errors dans le même test (l.165-170) ; le test 'does not mark invalid before touched' (l.156-162) ne dispatche jamais de blur ensuit
- **[edge]** Cascade de l'attribut placeholder selon appearance/floatLabel non testée (fill direct ; outline+auto ⇒ sentinelle ' ' ; outline+always ⇒ vrai placeholder).
  - source: `base-input.ts:140-144 (placeholderAttr) ; text-field.html:46 ([attr.placeholder])`
  - assert: fill + placeholder='Ex' ⇒ getAttribute('placeholder')==='Ex'. outline sans placeholder ⇒ getAttribute('placeholder')===' '.
  - preuve: Aucune occurrence de 'placeholder', 'appearance' ou 'floatLabel' dans le spec ; ces inputs ne sont pas bindés dans TextFieldHost.
- **[edge]** Seule la première regex de pattern posée (multi ignorées) et le cas pattern=[] (attribut null) non testés.
  - source: `text-field.ts:39-41 (patternAttr = pattern()[0]?.source ?? null) ; text-field.html:50`
  - assert: pattern=[/a/,/b/] ⇒ getAttribute('pattern')==='a'. pattern=[] ⇒ getAttribute('pattern') null.
  - preuve: text-field.spec.ts:110 ne pose qu'une seule regex [/[a-z]+/] et asserte '[a-z]+' (l.114) ; aucun test multi-regex ni tableau vide (host.pattern par défaut [] mais l'attribut 'pattern' n'est jamais ass
- **[edge]** Attributs name et autocomplete jamais assertés (posés seulement si non vides).
  - source: `base-input.ts:67 (name), 89 (autocomplete) ; text-field.html:45 ([attr.name]), 47 ([attr.autocomplete])`
  - assert: Sans valeur : getAttribute('name') et 'autocomplete' null. Avec name='email'/autocomplete='email' : attributs égaux à 'email'.
  - preuve: Aucune occurrence de 'name' (en tant qu'attribut) ni 'autocomplete' dans le spec ; non bindés dans TextFieldHost.
- **[edge]** Suffix (texte et TemplateRef) non testé ; seule la variante prefix string l'est. Branches asTemplate/asText pour suffix et TemplateRef de prefix non exercées.
  - source: `base-input.ts:95-97,146-152 ; text-field.html:71-79 (suffix), 26-34 (prefix template)`
  - assert: Avec suffix='kg' : un .kt-field-box\_\_affix contient 'kg'. Avec un TemplateRef en prefix : le contenu projeté du template est rendu.
  - preuve: text-field.spec.ts:173-177 ne couvre que prefix string ('https://') ; aucune occurrence de 'suffix' ni de TemplateRef dans le spec, et [suffix] non bindé dans TextFieldHost.
- **[edge]** Affichage erreurs multiples vs première seule (showAllErrors par défaut) non testé : une seule erreur rendue même si plusieurs fournies.
  - source: `field.ts:81-84 (showAllErrors), 127-129 (displayedErrors slice(0,1))`
  - assert: Avec deux erreurs et champ touché/invalide, défaut : expect(el.querySelectorAll('.kt-field\_\_error-message').length).toBe(1).
  - preuve: Tous les host.errors.set du spec ne contiennent qu'une seule erreur (l.158,166,182) ; aucune occurrence de '.kt-field\_\_error-message' ni d'assertion sur la longueur du tableau d'erreurs rendues.

## number-field (14)

- **[a11y]** role="spinbutton" posé en dur sur l'input n'est jamais asserté.
  - source: `number-field.html:42 (role="spinbutton")`
  - assert: expect(input().getAttribute('role')).toBe('spinbutton')
  - preuve: Recherche 'role' dans number-field.spec.ts : aucune occurrence. Le test renders ne contrôle que type/inputmode (l.50-52). Pas d'e2e. CONFIRMÉ.
- **[a11y]** aria-valuemin / aria-valuemax (et max natif) reflétant min()/max() ne sont pas assertés.
  - source: `number-field.html:43-44,54 (aria-valuemin/aria-valuemax, attr.max)`
  - assert: host.max wired; expect(input().getAttribute('aria-valuemin')).toBe('18'); expect(input().getAttribute('aria-valuemax')).toBe('99'); expect(input().getAttribute('max')).toBe('99')
  - preuve: Aucune occurrence de 'aria-value' ni 'max' (attribut) dans le spec. Le host ne câble même pas max (template l.9-15 : value/label/clearable/min/pending). Seul l'attribut natif 'min' est testé (l.118-12
- **[a11y]** aria-valuenow OBSERVABLE (attribut) reflétant la valeur courante non testé.
  - source: `number-field.html:45 (aria-valuenow)`
  - assert: Après ArrowUp expect(input().getAttribute('aria-valuenow')).toBe('1'); valeur null => toBeNull()
  - preuve: Le test ArrowUp/Down (l.165-179) n'asserte que host.value() (modèle), jamais input().getAttribute('aria-valuenow'). 'aria-value' absent du spec. CONFIRMÉ.
- **[a11y]** data-disabled sur .kt-field-box et input.disabled propagés.
  - source: `number-field.html:19 (data-disabled) et :47 ([disabled])`
  - assert: disabled=true => input().disabled===true et .kt-field-box[data-disabled]===''
  - preuve: 'disabled' / 'data-disabled' absents du spec ; le host ne câble pas disabled. Seul data-pending est testé (l.80-85). CONFIRMÉ.
- **[a11y]** readonly propagé (input.readOnly) et clear masqué en readonly (showClear exclut readonly).
  - source: `number-field.html:48 ([readOnly]) + base-input.ts:123-125 (showClear)`
  - assert: readonly=true => input().readOnly===true ; clearable+value+readonly => clearButton()===null
  - preuve: 'readonly'/'readOnly' absents du spec ; host ne câble pas readonly. clearButton testé uniquement en états actifs (l.100-116). CONFIRMÉ.
- **[a11y]** aria-required posé quand required=true.
  - source: `base-input.ts:59 (required) propagé via number-field.html:9 ([required])`
  - assert: required=true => input().getAttribute('aria-required')==='true'
  - preuve: 'required' / 'aria-required' absents du spec ; host ne câble pas required. CONFIRMÉ.
- **[a11y]** Affichage d'erreur via matcher : aria-invalid / aria-describedby / data-invalid DOM, vs parseErrors() interne.
  - source: `base-input.ts:116-121 + number-field.html:7-8,18`
  - assert: invalid=true + touched=true => input().getAttribute('aria-invalid')==='true' et message lié via aria-describedby
  - preuve: Le test parse error (l.124-135) asserte l'état interne rawValue.parseErrors() ; 'aria-invalid', 'aria-describedby', 'data-invalid' absents du spec. invalid/touched jamais câblés. CONFIRMÉ.
- **[correctness]** Touches fléchées inertes en disabled OU readonly (garde de sortie).
  - source: `number-field.ts:73 (if (this.disabled() || this.readonly()) return;)`
  - assert: readonly=true puis ArrowUp => host.value() inchangé ; idem disabled ; input().readOnly===true / input().disabled===true
  - preuve: Le host de test (l.18-24) ne déclare ni disabled ni readonly et le template (l.9-15) ne les câble pas. Aucun ArrowUp/Down n'est précédé d'un état verrouillé. CONFIRMÉ.
- **[correctness]** Pas décimal : arrondi anti-flottant (step=0.1 => 0.3 et non 0.30000000000000004).
  - source: `number-field.ts:113-118 (toFixed(precision))`
  - assert: step=0.1, value=0.2, ArrowUp => expect(host.value()).toBe(0.3)
  - preuve: 'step' n'apparaît jamais dans le spec et n'est pas câblé par le host (template l.9-15). Les tests arrow (l.165-193) utilisent le step par défaut (1). Branche decimalIdx !== -1 jamais exercée. CONFIRMÉ
- **[correctness]** Datalist : list=datalistId + <datalist><option> quand suggestions() fourni ; list null sinon.
  - source: `number-field.ts:38,43-46 + number-field.html:56,62-68`
  - assert: suggestions wired => input().getAttribute('list')===datalistId, option values=['1','2'], 1er label='Un' ; sans => list null
  - preuve: 'suggestions', 'datalist', 'list' absents du spec ; le host (l.18-24) n'expose pas suggestions et le template ne le câble pas. CONFIRMÉ.
- **[correctness]** Échap efface le champ quand clearable et non vide (via super.onKeyDown).
  - source: `base-input.ts:158-163 (Escape => clear) appelé via number-field.ts:75`
  - assert: clearable=true, value=5, keydown Escape => host.value()===null et document.activeElement===input()
  - preuve: 'Escape' n'apparaît pas dans number-field.spec.ts ; les seuls keydown dispatchés sont ArrowUp/ArrowDown (l.168-192). CONFIRMÉ.
- **[edge]** Seed sur champ null sans min mais avec max : ArrowUp part de max().
  - source: `number-field.ts:95-96 (else if max !== undefined newValue = max)`
  - assert: max=50, value=null, ArrowUp => host.value()===50 et aria-valuenow==='50'
  - preuve: max non câblé par le host. Seuls seed=0 (l.168-170, value null sans min/max) et seed=min (l.186-188) sont couverts. La branche else-if max non exercée. CONFIRMÉ.
- **[edge]** Plafonnement à max sur incrément (ArrowUp ne dépasse pas max).
  - source: `number-field.ts:108-110 (if max !== undefined && newValue > max newValue = max)`
  - assert: max=10, value=10, ArrowUp => host.value()===10
  - preuve: max jamais câblé. Le test 'respects min, max boundaries' (l.181-193) malgré son titre ne pose que min (l.183) et ne teste que le plancher (l.186-192) ; aucune assertion de clamp haut. CONFIRMÉ.
- **[edge]** Reset re-synchronise le texte brut sur valeur courante NON nulle (branche String(value)).
  - source: `number-field.ts:125-127 (value===null ? '' : String(value))`
  - assert: value=7, saisir texte parasite, reset() => input().value==='7'
  - preuve: Le seul test reset (l.87-98) part d'une saisie 'abc' => value null => branche '' (l.97 attend ''). La branche valeur non nulle n'est jamais exercée. CONFIRMÉ.

## dialog (14)

- **[a11y]** aria-modal="true" posé en DOM sur le conteneur (host [attr.aria-modal] alimenté par ariaModal:true).
  - source: `dialog-container.ts:27 '[attr.aria-modal]':'_config.ariaModal' ; dialog-config.ts:21 ariaModal:true`
  - assert: e2e : await expect(page.locator('.cdk-dialog-container')).toHaveAttribute('aria-modal','true').
  - preuve: e2e/dialog.spec.ts l.16 n'assert que role='dialog' ; aucune occurrence de 'aria-modal' dans les deux e2e. dialog.spec.ts (unit) ne monte jamais KtDialogContainer (les hôtes de test utilisent un <div c
- **[a11y]** aria-describedby réellement posé en DOM sur le conteneur et pointant vers le <p ktDialogDescription> visible (Renderer2, symétrique de aria-labelledby).
  - source: `dialog-description.directive.ts:43-46 setAttribute container 'aria-describedby' ; dialog-container.ts:30 host binding`
  - assert: e2e : const descId=await container.getAttribute('aria-describedby'); expect(descId).toContain('kt-dialog-desc-'); await expect(page.locator(`#${descId}`)).toBeVisible().
  - preuve: e2e/dialog.spec.ts l.27-30 n'assert QUE aria-labelledby ; 'aria-describedby' n'apparaît dans aucun e2e. dialog.spec.ts (unit) l.79-81 vérifie config.ariaDescribedBy (modèle interne) sur un host sans c
- **[a11y]** Nettoyage de l'aria-describedby orphelin : id pré-réservé non adopté → afterNextRender RETIRE l'attribut du conteneur.
  - source: `dialog-container.ts:64-67`
  - assert: unit/e2e : ouvrir un dialog sans [ktDialogDescription] et expect(container).not.toHaveAttribute('aria-describedby').
  - preuve: Aucun des deux e2e n'ouvre un dialog sans description (tous les boutons ouvrent des dialogs avec description). dialog.spec.ts (unit) ne monte jamais KtDialogContainer, donc afterNextRender l.61-77 n'e
- **[a11y]** Fermeture clavier par Escape (preventDefault + close) dans le cas NON verrouillé.
  - source: `dialog-container.ts:84-89 event.key==='Escape'`
  - assert: e2e : ouvrir, await page.keyboard.press('Escape'), expect(container).toBeHidden() puis expect(trigger).toBeFocused().
  - preuve: e2e/dialog.spec.ts teste le clic scrim (l.41-50) ; les keyboard.press présents (l.62,67,71) ne pressent que 'Tab' (focus-trap), jamais 'Escape'. Aucune occurrence de 'Escape' dans les deux e2e ni dans
- **[a11y]** Avertissement dev (WCAG 4.1.2) si le dialog n'a AUCUN nom accessible (ni [ktDialogTitle] ni aria-label) à l'ouverture.
  - source: `dialog-container.ts:69-76 console.warn '[ktDialog] dialog sans nom accessible'`
  - assert: unit : espionner console.warn, monter un conteneur sans titre/aria-label, expect(warnSpy).toHaveBeenCalledWith(stringContaining('sans nom accessible')).
  - preuve: dialog.spec.ts ne monte jamais KtDialogContainer et n'espionne jamais console.warn (aucun vi.spyOn(console,...) dans le fichier). L'avertissement l.73-76 n'est donc jamais déclenché ni asserté.
- **[a11y]** Garde-fou dev : ktDialogClose avertit (WCAG 4.1.2) quand le bouton de fermeture n'a aucun nom accessible.
  - source: `dialog-close.directive.ts:39-52 afterNextRender warn`
  - assert: unit : monter <button ktDialogClose></button> (vide), espionner console.warn, expect(warnSpy).toHaveBeenCalled().
  - preuve: Le seul test ktDialogClose (dialog.spec.ts l.12-33) utilise <button [ktDialogClose]>Fermer</button> (texte présent → branche 'named'=true) ; aucun bouton vide/sans nom, aucun spy console.warn dans le
- **[a11y]** Restitution du focus au déclencheur après fermeture par SCRIM et par Escape (restoreFocus:true).
  - source: `dialog-config.ts:24 restoreFocus:true ; dialog-container.ts:83-88 chemins scrim/Escape`
  - assert: e2e : après backdrop.click(), expect(trigger).toBeFocused() ; idem après Escape.
  - preuve: Le seul toBeFocused() sur le trigger est après le clic 'Annuler' (e2e/dialog.spec.ts l.38). Le test scrim (l.41-50) s'arrête à toBeHidden() sans vérifier le focus ; le chemin Escape n'est pas testé du
- **[correctness]** Fermeture AVEC résultat typé : ref.close('confirm') propage le résultat jusqu'à l'ouvreur (closed) — flux réel de bout en bout, pas un mock.
  - source: `demo-confirm-dialog.ts confirm()->ref.close ; dialog-demo.ts lastResult ; flux closed`
  - assert: e2e : ouvrir, cliquer getByRole('button',{name:'Supprimer',exact:true}), puis expect(page.locator('.page\_\_result code')).toHaveText(/Supprim/) et expect(container).toBeHidden().
  - preuve: e2e/dialog.spec.ts ferme uniquement via 'Annuler' (l.33-37, résultat undefined) ; le focus-trap (l.63) focalise 'Supprimer' au Tab mais ne le clique JAMAIS. Côté unit, dialog.spec.ts l.123-132 (inject
- **[correctness]** disableClose : un dialog verrouillé ne se ferme NI au scrim NI à Escape (ngOnInit ne s'abonne pas).
  - source: `dialog-container.ts:82-90 if(!this._config.disableClose)`
  - assert: e2e : ouvrir le dialog verrouillé, cliquer le backdrop puis presser Escape, et expect(container).toBeVisible() après chacun.
  - preuve: Les deux e2e n'ouvrent que 'Supprimer le fichier…' (desktop) et 'Centré → bottom-sheet' (mobile) ; aucun n'ouvre un dialog disableClose. Seul le cas par défaut (scrim ferme, e2e/dialog.spec.ts l.41-50
- **[correctness]** ktDialogTitle/ktDialogDescription PRÉSERVENT un id fourni par le consommateur (host.id) et câblent aria-labelledby/aria-describedby sur cet id existant.
  - source: `dialog-title.directive.ts:34-35 (host.id || …) ; dialog-description.directive.ts:34-35,50-57`
  - assert: unit : <h2 id="mon-titre" ktDialogTitle> → expect(container.getAttribute('aria-labelledby')).toBe('mon-titre') (aucun id généré).
  - preuve: dialog.spec.ts l.42 (<h2 ktDialogTitle> sans id) et l.68 (<p ktDialogDescription> sans id) ne testent QUE le cas id généré : assertions toMatch(/^kt-dialog-title-\d+$/) l.57 et /^kt-dialog-desc-\d+$/
- **[correctness]** resolveKtDialogPanelClass (fonction pure) : centered-sheet/centered-fullscreen → classe concrète selon compact (centré desktop, sheet/fullscreen compact).
  - source: `dialog-config.ts:87-95 resolveKtDialogPanelClass ; dialog-opener.ts:73-77`
  - assert: unit : expect(resolveKtDialogPanelClass('centered-sheet',false)).toEqual(['kt-dialog']) et (…,true) toEqual(['kt-dialog','kt-dialog--sheet']) ; ('fullscreen') contient 'kt-dialog--fullscreen'.
  - preuve: Aucun import ni appel de resolveKtDialogPanelClass dans dialog.spec.ts (la fonction pure n'a aucun test unitaire). e2e/dialog.mobile.spec.ts l.16 vérifie kt-dialog--sheet en compact uniquement ; le ca
- **[edge]** Animation de fermeture : isClosing→true (.kt-dialog-container--closing) et fermeture réelle après transitionend ; double-close ignoré (garde isClosing()).
  - source: `dialog-container.ts:97-130 animateAndClose ; host '[class.kt-dialog-container--closing]':'isClosing()' (l.32)`
  - assert: e2e : déclencher la fermeture et, avant disparition, expect(container).toHaveClass(/kt-dialog-container--closing/) ; puis expect(container).toBeHidden().
  - preuve: e2e/dialog.mobile.spec.ts l.59-66 assert l'animation d'ENTRÉE (animationName contient 'kt-sheet-in') ; aucun e2e n'assert la classe 'kt-dialog-container--closing' ni la séquence de sortie. dialog.spec
- **[edge]** ktDialogClose pose buttonType=null (pas de type) quand l'hôte n'est PAS un <button> (ex. <a ktDialogClose>).
  - source: `dialog-close.directive.ts:35 (tagName==='BUTTON' ? 'button' : null)`
  - assert: unit : monter <a ktDialogClose>…</a> et expect(anchor.hasAttribute('type')).toBe(false).
  - preuve: dialog.spec.ts l.15-33 monte UNIQUEMENT un <button [ktDialogClose]> et assert type='button' (l.29) ; la branche non-bouton (null) n'est jamais exercée — aucun hôte <a>/non-button dans les specs.
- **[edge]** ktDialogDescription nettoie sa référence au démontage : ngOnDestroy remet config.ariaDescribedBy à null si c'était son id.
  - source: `dialog-description.directive.ts:59-63 ngOnDestroy`
  - assert: unit : détruire la vue portant [ktDialogDescription] et expect(config.ariaDescribedBy).toBeNull().
  - preuve: dialog.spec.ts l.62-83 (DialogDescription) ne fait que detectChanges() puis assert config.ariaDescribedBy = id ; aucun fixture.destroy()/ComponentRef.destroy() n'est appelé, donc ngOnDestroy n'est jam

## field (13)

- **[a11y]** helpLabel par défaut = 'Help' (anglais neutre) quand ni input ni config fournis.
  - source: `field.ts:64 helpLabel = input(this.config?.helpLabel ?? 'Help')`
  - assert: sans surcharger helpLabel (laisser le défaut interne 'Help'), helpText défini ⇒ expect(helpBtn.getAttribute('aria-label')).toBe('Help')
  - preuve: Le host force toujours `helpLabel = signal('Aide')` (spec:40) passé en input (spec:19) ; les tests assertent 'Aide' (spec:160) et un override 'Information complémentaire' (spec:168), jamais le défaut
- **[a11y]** Région live d'erreur TOUJOURS présente dans le DOM (même hors erreur) avec aria-live="polite".
  - source: `field.html:36 <p class="kt-field__error" aria-live="polite"> (conteneur hors @if)`
  - assert: à l'état initial (invalid=false) : const err=el.querySelector('.kt-field**error'); expect(err).toBeTruthy(); expect(err!.getAttribute('aria-live')).toBe('polite'); expect(err!.querySelector('.kt-field**error-message')).toBeNull()
  - preuve: Le seul accès à '.kt-field\_\_error'/aria-live='polite' est dans 'shows errors' (spec:108-109) après host.invalid.set(true) ; aucune assertion sur l'existence du conteneur à l'état initial.
- **[a11y]** Le bouton d'aide porte type="button" et aria-describedby absent (=null dans le template).
  - source: `field.html:13 type="button" + field.html:17 [attr.aria-describedby]="null"`
  - assert: expect(helpBtn.getAttribute('type')).toBe('button'); expect(helpBtn.hasAttribute('aria-describedby')).toBe(false)
  - preuve: Le spec sélectionne '.kt-field\_\_help' (spec:158,167,195,204) mais n'asserte jamais son attribut 'type' ni 'aria-describedby'.
- **[a11y]** aria-required et aria-invalid sont RETIRÉS (attribut absent), pas mis à 'false', à l'état par défaut.
  - source: `field-control.ts:18-19 aria-invalid/aria-required => null quand false`
  - assert: à l'état par défaut : expect(input().hasAttribute('aria-required')).toBe(false); expect(input().hasAttribute('aria-invalid')).toBe(false)
  - preuve: 'reflects required' (spec:97) et 'shows errors' (spec:106,117) n'assertent que la valeur 'true' ; aucun hasAttribute(...).toBe(false) pour aria-required/aria-invalid à l'état initial.
- **[a11y]** L'astérisque requis (.kt-field**required) et l'icône d'aide (.kt-field**help-icon) sont aria-hidden="true".
  - source: `field.html:6 et field.html:20 (aria-hidden="true")`
  - assert: expect(el.querySelector('.kt-field**required')!.getAttribute('aria-hidden')).toBe('true') ; idem pour .kt-field**help-icon
  - preuve: 'reflects required' (spec:98) vérifie seulement `toBeTruthy()` sur '.kt-field**required' ; aucune lecture de 'aria-hidden', et '.kt-field**help-icon' n'apparaît nulle part dans le spec.
- **[a11y]** Ordre de composition de aria-describedby = hint, puis error, puis tooltip, puis customDescribedBy.
  - source: `field.ts:131-147 describedBy (push hint -> error -> tooltip -> custom)`
  - assert: avec hint + invalid+errors + helpText + customDescribedBy actifs, const parts=describedBy.split(' '); attendre l'ordre [`${id}-hint`, `${id}-error`, /kt-tooltip/, 'aide-externe']
  - preuve: 'appends customDescribedBy' (spec:179-190) utilise toContain/toMatch (présence) sans jamais combiner hint+error+tooltip+custom ni vérifier l'ordre via split.
- **[correctness]** Apparence par défaut 'fill' : sans input, l'hôte <kt-field> doit porter data-appearance="fill" ; avec appearance='outline' ⇒ 'outline'.
  - source: `field.ts:49 host '[attr.data-appearance]' + field.ts:90-92 resolvedAppearance`
  - assert: expect(el.querySelector('kt-field')!.getAttribute('data-appearance')).toBe('fill') sans input ; puis exposer/poser appearance='outline' ⇒ toBe('outline')
  - preuve: Aucune occurrence de 'data-appearance' ni 'resolvedAppearance' dans field.spec.ts ; le host FieldHost (spec:30-48) n'expose même pas d'input appearance. Aucun e2e pour field.
- **[correctness]** Politique de label flottant par défaut 'auto' : l'hôte doit porter data-float-label="auto", 'always' si fourni.
  - source: `field.ts:50 host '[attr.data-float-label]' + field.ts:99-101 resolvedFloatLabel`
  - assert: expect(el.querySelector('kt-field')!.getAttribute('data-float-label')).toBe('auto') ; après floatLabel='always' ⇒ toBe('always')
  - preuve: Aucune occurrence de 'data-float-label' ni 'resolvedFloatLabel' ni 'floatLabel' dans field.spec.ts. Le host n'expose pas l'input floatLabel.
- **[correctness]** Cascade de résolution via KT_FIELD_CONFIG (input ?? config ?? défaut) pour appearance/floatLabel/hideHintWhenInvalid/showAllErrors/helpLabel : la branche 'config?' n'est jamais exercée.
  - source: `field.ts:64,78,82,91,100 (this.config?.* )`
  - assert: configurer TestBed avec provideKtField({ appearance:'outline', floatLabel:'always', helpLabel:'Aide-config', hideHintWhenInvalid:true }) et asserter data-appearance='outline', data-float-label='always', l'aria-label du bouton d'aide ='Aide-config', et le hint masqué en erreur
  - preuve: Le seul TestBed est `TestBed.configureTestingModule({ imports: [FieldHost] })` (spec:56) ; aucune occurrence de KT_FIELD_CONFIG ni provideKtField dans le spec, seuls les chemins input/défaut-dur sont
- **[correctness]** onHelpClick appelle preventDefault() ET stopPropagation() avant d'émettre.
  - source: `field.ts:149-153 onHelpClick (event.preventDefault(); event.stopPropagation())`
  - assert: const ev=new MouseEvent('click',{cancelable:true,bubbles:true}); helpBtn.dispatchEvent(ev); expect(ev.defaultPrevented).toBe(true) ; et vérifier la non-propagation via un listener sur un parent
  - preuve: 'emits helpClick' (spec:201-208) utilise `helpBtn.click()` et asserte uniquement `expect(host.lastHelpEvent).toBeTruthy()` ; aucune lecture de defaultPrevented ni listener parent.
- **[correctness]** Contrôle ktFieldControl projeté SANS parent KtField : id=null, aria-describedby/aria-invalid/aria-required absents (branche parent?.??null/false).
  - source: `field-control.ts:25-28 (parent?.baseId() ?? null, ?? false)`
  - assert: monter un host avec <input ktFieldControl> hors de tout <kt-field> ; expect(input.hasAttribute('id')).toBe(false); expect(input.hasAttribute('aria-invalid')).toBe(false); expect(input.hasAttribute('aria-required')).toBe(false)
  - preuve: Le seul template de test (spec:8-28) place toujours <input ktFieldControl /> à l'intérieur de <kt-field> ; aucun montage hors parent, la branche parent==null n'est jamais exercée.
- **[correctness]** Le tooltip d'aide n'est ajouté à aria-describedby que s'il est ACTIF (tooltip.isActive()) ; rendu mais inactif ⇒ id absent.
  - source: `field.ts:137-140 if (tooltip && tooltip.isActive()) ids.push(tooltip.idForA11y)`
  - assert: dans un état où le tooltip d'aide est rendu mais isActive()===false (ex. helpText=' ' ou tooltip désactivé), expect(input().getAttribute('aria-describedby') ?? '').not.toMatch(/kt-tooltip-/)
  - preuve: isActive() (tooltip.ts:102-108) est vrai dès que le contenu est non-vide, donc 'wires the active tooltip' (spec:171-177) ne couvre que le cas actif ; aucun test ne rend un tooltip inactif pour asserte
- **[edge]** Label absent : sans input label, aucun <label> rendu (@if label()).
  - source: `field.html:2-9 @if (label(); as labelText)`
  - assert: host.label.set(undefined); fixture.detectChanges(); expect(el.querySelector('label')).toBeNull()
  - preuve: Le signal label est initialisé à 'Nom' (spec:31) et n'est jamais remis à undefined dans le spec ; aucune assertion `querySelector('label')` à null.

## year-month-field (13)

- **[a11y]** aria-invalid='true' sur l'input quand invalid && touched (showInvalid → kt-field [invalid] → ktFieldControl).
  - source: `year-month-field.html:8 [invalid]="showInvalid()" + field-control.ts:18`
  - assert: [invalid]=true [touched]=true → expect(input().getAttribute('aria-invalid')).toBe('true') ; et absent quand touched=false.
  - preuve: Le host de test (l.8) ne lie que value/label/clearable — jamais [invalid] ni [touched]. Aucune assertion 'aria-invalid' dans le spec (grep: no match). L'e2e n'assert aria-invalid que sur ex.getByLabel
- **[a11y]** aria-required='true' quand [required]=true, absent par défaut.
  - source: `year-month-field.html:9 [required]="required()" → field-control.ts:19`
  - assert: [required]=true → expect(input().getAttribute('aria-required')).toBe('true') ; sans required → expect(input().hasAttribute('aria-required')).toBe(false).
  - preuve: Le host ne lie jamais [required] et le spec ne contient aucune assertion 'aria-required' (grep: no match). L'e2e cible aria-required sur kt-date-field 'Requis' (temporal.spec.ts:33).
- **[a11y]** État disabled : input natif désactivé + data-disabled sur kt-field-box.
  - source: `year-month-field.html:41 [disabled]="disabled()" + html:19 data-disabled`
  - assert: [disabled]=true → expect(input().disabled).toBe(true) et expect(el.querySelector('.kt-field-box').getAttribute('data-disabled')).toBe('').
  - preuve: Le host ne lie jamais [disabled] et aucune assertion disabled/data-disabled n'existe dans le spec (grep: no match). L'e2e teste disabled sur kt-date-field 'Désactivé' (temporal.spec.ts:31).
- **[a11y]** État readonly : input.readOnly=true (et bouton clear masqué car showClear exige !readonly).
  - source: `year-month-field.html:42 [readOnly]="readonly()" + base-input.ts:124 (showClear)`
  - assert: [readonly]=true → expect(input().readOnly).toBe(true) ; et avec clearable+value+readonly → bouton clear absent.
  - preuve: Le host ne lie jamais [readonly] et aucune assertion readOnly/readonly dans le spec (grep: no match). L'e2e teste readonly sur kt-date-field 'Lecture seule' (temporal.spec.ts:32).
- **[a11y]** Le bouton effacer expose un aria-label accessible (clearLabel, défaut 'Clear') ; icône 'close' aria-hidden.
  - source: `year-month-field.html:62-64 [attr.aria-label]="clearLabel()" + icon aria-hidden`
  - assert: expect(clearBtn.getAttribute('aria-label')).toBe('Clear') ; et icône .kt-field-box\_\_icon aria-hidden='true'.
  - preuve: Le test clear (l.65-66) ne vérifie que clearBtn truthy, pas son aria-label ; aucune assertion 'aria-label' ou 'aria-hidden' dans le spec (grep: no match). L'e2e getByRole('button',{name:'Effacer'}) ci
- **[a11y]** clear() (bouton/Échap) redonne le focus à l'input natif.
  - source: `base-input.ts:182-186 (clear → this.focus()) + base-input.ts:166-168`
  - assert: Après clearBtn.click() → expect(document.activeElement).toBe(input()).
  - preuve: Le test clear (l.61-71) n'assert que host.value() et input().value, jamais document.activeElement. grep 'activeElement'/'focus': no match dans le spec.
- **[a11y]** aria-busy='true' + data-pending pendant validation async ([pending]=true).
  - source: `year-month-field.html:43 [attr.aria-busy] + html:20 data-pending`
  - assert: [pending]=true → expect(input().getAttribute('aria-busy')).toBe('true') et .kt-field-box data-pending=''.
  - preuve: Le host ne déclare ni ne lie [pending] ; aucune assertion aria-busy/data-pending dans le spec (grep: no match). L'e2e n'exerce aucun état pending.
- **[correctness]** Parsing tolérant d'une saisie invalide/partielle ('2026-13', 'abc', '2026') : parse() attrape la RangeError de Temporal.PlainYearMonth.from et retourne null, jamais d'exception ni de valeur fausse.
  - source: `base-temporal-field.ts:57-65 (parse → fromString via year-month-field.ts:32-34)`
  - assert: input().value='2026-13'; dispatch 'input'; detectChanges → expect(host.value()).toBeNull() ; idem 'abc' et '2026'.
  - preuve: Le spec ne dispatche 'input' qu'avec '2026-09' (l.46-47) et '' (l.55-56). Aucune entrée invalide ('2026-13'/'abc'/'2026') n'est exercée ; grep des littéraux confirme zéro occurrence. L'e2e n'envoie au
- **[correctness]** Touche Échap efface le champ (clearable+non vide) avec preventDefault, et clear() temporel vide AUSSI l'input natif.
  - source: `base-input.ts:158-163 (onKeyDown) + base-temporal-field.ts:76-80 (clear surchargé)`
  - assert: clearable=true, value posée ; dispatch keydown 'Escape' → expect(host.value()).toBeNull() ET expect(input().value).toBe('').
  - preuve: Le seul test clear (l.61-71) utilise clearBtn.click(), pas keydown 'Escape' ; aucune occurrence de 'Escape'/'keydown' dans le spec (grep: no match). L'e2e n'exerce pas Échap sur kt-year-month-field.
- **[correctness]** Synchro input↔valeur sous focus : l'effet n'écrase pas une saisie partielle (isFocused && val===null garde la valeur DOM).
  - source: `base-temporal-field.ts:39-49 (condition !isFocused || val !== null)`
  - assert: input().focus() ; saisir '2026' (→ value null) ; expect(input().value).toBe('2026') (non réécrit à '').
  - preuve: Le spec ne teste la réflexion value→input qu'avec input NON focalisé (l.39-43, host.value.set sans focus préalable). Aucun appel à .focus() ni scénario focus+saisie partielle (grep 'focus': no match).
- **[correctness]** Attributs natifs min/max via serializedMin/serializedMax (sérialisation 'YYYY-MM'), absents quand non bornés.
  - source: `base-temporal-field.ts:98-106 + year-month-field.html:46-47 [attr.min]/[attr.max]`
  - assert: [min]=from('2026-01') [max]=from('2026-12') → expect(input().getAttribute('min')).toBe('2026-01') et max '2026-12' ; sans bornes → null.
  - preuve: Le host ne déclare pas d'inputs min/max et ne les lie pas ; aucune assertion getAttribute('min'/'max') dans le spec (grep 'min'/'max': no match). Le démo year-month ne pose pas de bornes (e2e silencie
- **[correctness]** touched passe à true au blur de l'input (déclencheur d'affichage d'erreur).
  - source: `year-month-field.html:51 (blur)="touched.set(true)"`
  - assert: [invalid]=true ; dispatch 'blur' → showInvalid devient true → expect(input().getAttribute('aria-invalid')).toBe('true').
  - preuve: Aucun dispatch d'événement 'blur' dans le spec ; le clic clear pose touched via clear() (base-input.ts:184) mais ce n'est pas le chemin (blur) et touched n'est jamais asserté. grep 'blur': no match.
- **[edge]** showClear : le bouton effacer N'apparaît PAS quand vide/disabled/readonly ; n'est testée que la branche 'visible'.
  - source: `base-input.ts:123-125 (showClear) + year-month-field.html:62`
  - assert: clearable=true mais value=null → expect(el.querySelector('.kt-field-box\_\_clear')).toBeNull() ; clearable+value+disabled=true → bouton absent.
  - preuve: Le seul test clear (l.61-71) pose clearable=true ET value≠null puis assert clearBtn truthy. Aucune assertion d'absence (.kt-field-box\_\_clear toBeNull) ni cas disabled/readonly (grep: no match d'absenc

## radio (12)

- **[a11y]** Groupe sans `label` avec `ariaLabel` doit exposer aria-label (et non aria-labelledby) comme nom accessible du radiogroup.
  - source: `radio-group.ts:46-47`
  - assert: Avec un groupe sans label et [ariaLabel]='Taille', asserter group.getAttribute('aria-label')==='Taille' ET group.getAttribute('aria-labelledby')===null ET absence de .kt-radio-group\_\_legend.
  - preuve: RadioHost fixe label=signal('Offre') (radio.spec.ts:33) et ObjectRadioHost label="Responsable" (radio.spec.ts:46) ; aucun host ne laisse label vide ni ne fournit ariaLabel. Le seul test du nom (radio.
- **[a11y]** aria-invalid='true' doit être posé sur le radiogroup quand showInvalid(), et null tant que !touched.
  - source: `radio-group.ts:50`
  - assert: Après invalid+touched, asserter group.getAttribute('aria-invalid')==='true' ; tant que !touched, asserter qu'il vaut null.
  - preuve: Le seul test d'erreur (radio.spec.ts:159-168) n'assert que .kt-radio-group\_\_error-message (null puis textContent). Aucune occurrence de 'aria-invalid' dans radio.spec.ts ; l'e2e choice.spec.ts ne test
- **[a11y]** aria-describedby du groupe doit référencer errorId en erreur et hintId quand un hint de GROUPE est présent ; le hint de groupe (distinct du hint par-option) doit être rendu.
  - source: `radio-group.ts:67-69 et 151-156`
  - assert: Avec hint de groupe, asserter group.getAttribute('aria-describedby') contient hintId et #hintId textContent matche le hint ; en erreur, asserter aria-describedby contient errorId.
  - preuve: host.hint=signal(undefined) (radio.spec.ts:34) n'est jamais défini, donc .kt-radio-group\_\_hint n'est jamais rendu/assert. Le seul aria-describedby testé (radio.spec.ts:108-113) est celui de l'INPUT en
- **[a11y]** L'astérisque requis doit s'afficher dans la légende avec aria-hidden='true' quand required.
  - source: `radio-group.ts:57-59`
  - assert: Avec required, asserter présence de .kt-radio-group\_\_required avec textContent '\*' et getAttribute('aria-hidden')==='true'.
  - preuve: Le test required (radio.spec.ts:128-132) n'assert que aria-required sur [role=radiogroup]. Aucune occurrence de '.kt-radio-group\_\_required' ni de l'astérisque dans radio.spec.ts.
- **[correctness]** Mutuelle exclusion hint vs erreur : le hint de groupe disparaît quand une erreur s'affiche (@if hint() && !showInvalid()).
  - source: `radio-group.ts:67 et 153`
  - assert: Avec hint de groupe + invalid + touched, asserter absence de .kt-radio-group\_\_hint et que aria-describedby contient errorId mais PAS hintId.
  - preuve: Aucun host ne combine hint de groupe et erreur : host.hint reste undefined (radio.spec.ts:34). Aucune assertion sur .kt-radio-group\_\_hint nulle part dans radio.spec.ts ; l'e2e ne couvre pas ce cas.
- **[correctness]** displayedErrors n'affiche qu'une erreur par défaut (slice(0,1)) mais toutes si showAllErrors=true.
  - source: `radio-group.ts:145-147`
  - assert: Avec deux erreurs et touched : par défaut asserter une seule .kt-radio-group\_\_error-message ; avec showAllErrors, asserter querySelectorAll(...).length===2 dans l'ordre.
  - preuve: Le test d'erreur ne fournit qu'une seule erreur : errors.set([{ kind:'required', ... }]) (radio.spec.ts:161). showAllErrors n'est jamais biné dans le template du host (radio.spec.ts:15-28) ni assert ;
- **[correctness]** Gardes de commit désactivé : group.select() retourne tôt si disabled() et radio.onChange() retourne tôt si isDisabled() — un commit programmatique sur groupe/radio désactivé ne mute ni value ni touched.
  - source: `radio-group.ts:178-182 et radio.ts:98-103`
  - assert: Groupe disabled : appeler group.select('pro') et asserter host.value() reste null ET touched non passé à true. Sur un radio désactivé, déclencher onChange/change et asserter value inchangée.
  - preuve: Les tests disabled (radio.spec.ts:115-126) n'assertent que input.disabled (every/map des inputs). Aucun appel à group.select(...) ni dispatch de 'change' sur un input désactivé ; l'inertie au commit n
- **[correctness]** select() marque touched=true au commit, et le blur d'un radio enfant fait group.touched.set(true).
  - source: `radio-group.ts:181 et radio.ts:45`
  - assert: Après inputs[0].click(), asserter host.value()==='free' ET touched du groupe===true. Séparément, dispatcher 'blur' sur un input et asserter touched===true sans changer value.
  - preuve: Le test de commit (radio.spec.ts:102-106) n'assert que host.value()==='free'. Le model touched n'est jamais lu/assert directement (aucune occurrence de '.touched' assertée). Le handler (blur)=group.to
- **[edge]** groupName utilise le `name` fourni si non vide, sinon auto-génère ; la branche name custom doit propager le même name à tous les inputs.
  - source: `radio-group.ts:129`
  - assert: Avec [name]='offre', asserter que tous les inputs ont name==='offre'.
  - preuve: Le host ne binde pas [name] (radio.spec.ts:15-28) ; le seul test du name (radio.spec.ts:87-91) ne vérifie que l'unicité (Set.size===1, truthy) d'un name auto-généré. La branche this.name() non vide n'
- **[edge]** Désélection : repasser value de 'pro' à null doit décocher tous les inputs (isSelected false pour null/undefined).
  - source: `radio-group.ts:161-165`
  - assert: Après host.value.set('pro') puis host.value.set(null), asserter inputs.some(i=>i.checked)===false.
  - preuve: Le test (radio.spec.ts:93-100) couvre le null INITIAL (l.94) puis set('pro') (l.96), mais ne revient jamais à null après sélection. La transition sélectionné→null (réinitialisation) n'est jamais asser
- **[edge]** Exclusivité côté MODÈLE : basculer value de 'pro' à 'free' fait migrer checked (un seul input coché, le bon).
  - source: `radio.ts:79 et radio-group.ts:161-165`
  - assert: value.set('pro') puis value.set('free') : asserter inputs filtrés checked length===1 et que c'est inputs[0].
  - preuve: Le test modèle (radio.spec.ts:96-99) ne pose value qu'une fois ('pro') et n'assert que checked.length===1, sans identifier quel input ni tester de migration. L'e2e (choice.spec.ts:60-72) teste l'exclu
- **[edge]** id imposé : un id custom sur kt-radio est propagé à l'input ([id]=baseId()) et au hintId référencé par aria-describedby.
  - source: `radio.ts:72,76 et radio-group.ts:106,127`
  - assert: Avec <kt-radio id='r-free'>, asserter input id==='r-free' et que son hint a id 'r-free-hint' référencé par aria-describedby.
  - preuve: Aucun host ne fixe [id] sur kt-radio ni kt-radio-group (radio.spec.ts:15-28, 46-50). Le test de hint (radio.spec.ts:108-113) lit l'id auto-généré via aria-describedby sans imposer d'id. La branche id(

## button (11)

- **[a11y]** resolvedAriaLabel : un ariaLabel d'espaces seuls (vide après .trim()) doit RETOMBER sur l'aria-label natif (ou null), sans poser d'aria-label vide.
  - source: `button.ts:137 (this.ariaLabel()?.trim() || this.nativeAriaLabel || null)`
  - assert: host.ariaLabel.set(' '); fixture.detectChanges(); expect(button.hasAttribute('aria-label')).toBe(false) — et préservation du natif si présent.
  - preuve: button.spec.ts:210-213 ne pose qu'un libellé normal ('Supprimer') ; :206-207 teste l'absence par défaut ; :241-248 le natif sans input. Aucun test ne pose ariaLabel=' '. Le `.trim()` n'est donc jama
- **[a11y]** Priorité de l'input ariaLabel SUR l'aria-label natif quand les deux sont fournis (l'input gagne).
  - source: `button.ts:137 / button.ts:72 ('[attr.aria-label]':'resolvedAriaLabel()')`
  - assert: Host avec aria-label="natif" natif + [ariaLabel]="'input'" → expect(button.getAttribute('aria-label')).toBe('input').
  - preuve: NativeAriaHost (button.spec.ts:56-60) pose un aria-label natif mais AUCUN input ariaLabel ; TestHost pose l'input mais aucun aria-label natif. Aucun host ne combine les deux ; le cas de conflit/priori
- **[a11y]** La garde de nom accessible est court-circuitée par aria-labelledby sur l'hôte (pas d'avertissement même sans ariaLabel/natif).
  - source: `button.ts:148-153 (if (!this.resolvedAriaLabel() && !this.host.hasAttribute('aria-labelledby')))`
  - assert: Host iconOnly + aria-labelledby="x" sans ariaLabel → expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('sans nom accessible')).
  - preuve: Aucun host de test (TestHost, ConfigHost, NativeAriaHost, AnchorHost) ne pose aria-labelledby ; recherche du terme 'aria-labelledby' absente du spec. La sous-condition `!this.host.hasAttribute('aria-l
- **[a11y]** aria-busy doit être ABSENT (null) quand loading=false ; seul loading=true est asserté.
  - source: `button.ts:80 ('[attr.aria-busy]':'loading() ? "true" : null')`
  - assert: Par défaut, expect(button.hasAttribute('aria-busy')).toBe(false).
  - preuve: button.spec.ts:273 et e2e:25 assertent uniquement aria-busy='true' en chargement. Le bloc 'loading' (:254-266) teste l'absence de la classe `loading` mais jamais l'absence de l'attribut aria-busy. Auc
- **[a11y]** Sur un <button> (non-lien) désactivé non-interactif, tabindex ne doit JAMAIS être posé (branche tabindex='-1' réservée aux liens via && isLink).
  - source: `button.ts:79 ('[attr.tabindex]':'isDisabled() && !disabledInteractive() && isLink ? "-1" : null')`
  - assert: host.disabled.set(true) (bouton) → expect(button.hasAttribute('tabindex')).toBe(false).
  - preuve: button.spec.ts:400-405 teste tabindex='-1' uniquement sur le <a> (anchor). Le bloc 'disabled' du bouton (:321-337) n'inspecte jamais tabindex sur `button`. Aucune assertion `button.hasAttribute('tabin
- **[a11y]** Couplage <a> + disabledInteractive : aria-disabled='true' (jamais d'attribut disabled, inexistant sur <a>) ET reste dans l'ordre de tab (pas de tabindex).
  - source: `button.ts:78 (aria-disabled si isDisabled && (disabledInteractive || isLink))`
  - assert: Lien disabled+disabledInteractive → expect(anchor.getAttribute('aria-disabled')).toBe('true').
  - preuve: button.spec.ts:408-413 (lien disabled+interactif) n'assertе QUE l'absence de tabindex ; aria-disabled n'y est pas vérifié. :392-397 teste aria-disabled='true' sur lien disabled SANS disabledInteractiv
- **[a11y]** Cible tactile ~44-48px (size md) : aucune assertion de dimension réelle (boundingBox >= 44px).
  - source: `button.ts:22-23 (commentaire md ~44-48px) / button.ts:101-102`
  - assert: En e2e : const box = await page.getByRole('button',{name:'Filled'}).boundingBox(); expect(box.height).toBeGreaterThanOrEqual(44).
  - preuve: Aucun `boundingBox` ni mesure de hauteur/largeur dans e2e/button.spec.ts (qui se limite à AxeBuilder par défaut, lequel n'inclut pas target-size WCAG 2.5.5/2.5.8). Aucune mesure de dimension côté unit
- **[correctness]** haltDisabledEvents — chemin positif : un clic sur bouton ACTIF doit traverser et incrémenter le handler du consommateur (clickCount === 1).
  - source: `button.ts:161-166 (haltDisabledEvents) / button.ts:81 host (click)`
  - assert: button.click(); expect(host.clickCount).toBe(1) sur un bouton non désactivé.
  - preuve: La seule assertion sur clickCount est button.spec.ts:335 `expect(host.clickCount).toBe(0)` (cas disabled). Aucun `toBe(1)` dans le fichier ; l'e2e ne clique aucun bouton actif pour vérifier un handler
- **[correctness]** Avertissement dev-mode SPÉCIFIQUE 'iconOnly attend une icône via [icon].' quand iconOnly=true mais icon() absent (branche distincte de l'avertissement de nom accessible).
  - source: `button.ts:145-147 (if (!this.icon()) console.warn('[ktButton] iconOnly attend une icône via [icon].'))`
  - assert: iconOnly=true, icon=undefined → expect(warn).toHaveBeenCalledWith(expect.stringContaining('attend une icône via [icon]')).
  - preuve: button.spec.ts:218-227 pose icon('close') (toujours présent) et omet ariaLabel : il déclenche/asserte la branche 'sans nom accessible' via le préfixe générique '[ktButton] iconOnly' (:225). Le message
- **[edge]** data-full-width et data-icon-only sont posés à chaîne VIDE ('') quand actifs (attribut booléen) ; les tests ne vérifient que hasAttribute, pas la valeur exacte.
  - source: `button.ts:69-70 (fullWidth() ? "" : null / iconOnly() ? "" : null)`
  - assert: expect(button.getAttribute('data-full-width')).toBe('') (idem data-icon-only).
  - preuve: button.spec.ts:177/183 (full-width) et :191/199 (icon-only) utilisent exclusivement `hasAttribute(...).toBe(true/false)`. Aucun `getAttribute(...).toBe('')` dans le spec. L'e2e:32 utilise aussi `toHav
- **[edge]** Le <a> reflète aussi data-color/data-size (host tag-agnostique) ; sur lien seul data-mode est vérifié.
  - source: `button.ts:64-68 (sélecteur a[ktButton] + bindings data-* communs)`
  - assert: Sur AnchorHost avec mode/color/size bindés, expect(anchor.getAttribute('data-color'))... et data-size.
  - preuve: AnchorHost (button.spec.ts:63-84) ne binde ni mode, ni color, ni size (seuls disabled/disabledInteractive). e2e:49 vérifie data-mode='outlined' sur le lien mais pas data-color/data-size. Le reflet de

## checkbox (11)

- **[a11y]** aria-describedby du <input> pointe vers le hint quand un hint est fourni (sans erreur affichee).
  - source: `checkbox.ts:70 ([attr.aria-describedby]="describedBy()") + :185-190 (describedBy push hintId) + :86 (<p [id]="hintId()">)`
  - assert: host.hint deja a 'Obligatoire' au montage : expect(input().getAttribute('aria-describedby')).toBe(hintElement()!.id) avec id non vide.
  - preuve: checkbox.spec.ts ne contient aucune occurrence d'aria-describedby ; l.121-123/146 n'asserent que l'existence et le texte du hint. e2e choice.spec.ts:30-45 (cases) n'inspecte jamais describedby.
- **[a11y]** aria-describedby du <input> pointe vers errorId quand l'erreur est affichee (et le hint sort de describedBy).
  - source: `checkbox.ts:185-190 (push errorId si showInvalid && resolvedErrors>0 ; hint exclu) + :88 ([id]="errorId()")`
  - assert: apres input().click() avec invalid+errors : expect(input().getAttribute('aria-describedby')).toBe(el.querySelector('.kt-checkbox-error')!.id).
  - preuve: checkbox.spec.ts:149-159 (cas touche) n'asserte que aria-invalid='true' et le texte d'erreur ; aucun aria-describedby asserté. Absent aussi de l'e2e.
- **[a11y]** aria-label est pose sur le <input> quand ariaLabel est fourni.
  - source: `checkbox.ts:69 ([attr.aria-label]="resolvedAriaLabel()") + :183 (resolvedAriaLabel)`
  - assert: host avec ariaLabel='Accepter' et label undefined + contenu projete : expect(input().getAttribute('aria-label')).toBe('Accepter').
  - preuve: Le host CheckboxHost (template l.10-21) ne lie pas d'input ariaLabel et le mot 'aria-label' est absent de checkbox.spec.ts. Aucune case autonome avec ariaLabel dans la demo/e2e.
- **[a11y]** Le marqueur requis '\*' porte aria-hidden="true" (decoratif).
  - source: `checkbox.ts:79-81 (<span class="kt-checkbox__required" aria-hidden="true">*</span>)`
  - assert: host.required=true : expect(el.querySelector('.kt-checkbox\_\_required')!.getAttribute('aria-hidden')).toBe('true').
  - preuve: checkbox.spec.ts:114-119 verifie l'existence de .kt-checkbox\_\_required et aria-required='true' sur l'input, mais jamais aria-hidden sur l'asterisque.
- **[a11y]** Le warning a11y dev (afterNextRender) se declenche sans label/ariaLabel/contenu projete, et PAS quand l'un est present.
  - source: `checkbox.ts:200-211 (afterNextRender + console.warn WCAG 4.1.2)`
  - assert: spy sur console.warn ; monter une case sans label/ariaLabel/contenu -> expect(warn).toHaveBeenCalled() ; monter avec label -> expect(warn).not.toHaveBeenCalled().
  - preuve: Aucun spy console.warn dans checkbox.spec.ts (ni ailleurs) ; ce garde-fou n'est asserté nulle part. Le host fournit toujours un label par defaut, donc le chemin warn n'est jamais declenche.
- **[a11y]** La region d'erreur est une live region (aria-live="polite") sur la case autonome.
  - source: `checkbox.ts:88 (<div [id]="errorId()" class="kt-checkbox-error" aria-live="polite">)`
  - assert: expect(el.querySelector('.kt-checkbox-error')!.getAttribute('aria-live')).toBe('polite').
  - preuve: checkbox.spec.ts cible .kt-checkbox-error-message pour le texte (l.59) mais n'asserte jamais aria-live sur le conteneur .kt-checkbox-error. 'aria-live' est absent du fichier. e2e n'inspecte pas cette
- **[correctness]** onBlur() marque la case touched et revele les erreurs (chemin (blur) distinct du (change)) en mode autonome.
  - source: `checkbox.ts:75 ((blur)="onBlur()") + :231-233 (onBlur -> touched.set(true))`
  - assert: host.invalid=true; host.errors=[{kind:'required',message:'X'}]; input().dispatchEvent(new Event('blur')); fixture.detectChanges(); expect(input().getAttribute('aria-invalid')).toBe('true') et errorContainer() non nul.
  - preuve: Aucun 'blur' dispatche dans checkbox.spec.ts ; touched n'est mis qu'en passant par input().click() (l.82,153). Le chemin onBlur n'est exerce ni en unit ni en e2e.
- **[correctness]** En mode groupe, onBlur() vise group.touched (pas la case) ; et le [value] propre de la case est ignore au profit de l'appartenance au tableau du groupe.
  - source: `checkbox.ts:161-163 (isChecked via group.isSelected) + :231-233 (onBlur -> group?.touched) + :222-225 (onChange -> group.toggle + group.touched.set(true))`
  - assert: dans GroupHost : inputs(el)[0].dispatchEvent(new Event('blur')); detecter ; expect message d'erreur de groupe visible. Et : poser [value]=true sur une case enfant non selectionnee -> expect(input.checked).toBe(false).
  - preuve: checkbox-group.spec.ts ne dispatche jamais de blur (touched via click l.145 uniquement) ; et n'asserte jamais que le [value] propre d'une case enfant est ignore en mode groupe.
- **[correctness]** L'attribut name natif reflete name() positivement et reste absent quand vide (|| null).
  - source: `checkbox.ts:68 ([attr.name]="name() || null") + :131 (name input)`
  - assert: host avec name='cgu' : expect(input().getAttribute('name')).toBe('cgu') ; puis name='' -> expect(input().hasAttribute('name')).toBe(false).
  - preuve: Le host CheckboxHost ne lie pas name. checkbox-group.spec.ts:103-105 verifie seulement l'ABSENCE de name en mode groupe ; le reflet positif name='x' -> attribut n'est jamais asserté.
- **[correctness]** Resolution du message d'erreur par defaut (kind sans message -> message EN) et suppression via message:'' cote case AUTONOME.
  - source: `checkbox.ts:177 (resolvedErrors=errorResolver.resolveAll) + :179-181 (displayedErrors) + :91 (.kt-checkbox-error-message)`
  - assert: erreur [{kind:'required'}] apres click : errorContainer().textContent contient 'This field is required.' ; puis [{kind:'required',message:''}] : errorContainer() null mais input().getAttribute('aria-invalid')==='true'.
  - preuve: checkbox.spec.ts ne fournit jamais d'erreur sans message ni de message vide (toutes les erreurs ont un message, l.141/151/164). Ces deux branches ne sont testees que dans checkbox-group.spec.ts:152-16
- **[edge]** showAllErrors : displayedErrors affiche TOUTES les erreurs (vs slice(0,1) par defaut) sur la case autonome.
  - source: `checkbox.ts:179-181 (displayedErrors = showAllErrors ? resolvedErrors : slice(0,1)) + :145 (input showAllErrors)`
  - assert: 2 erreurs + touched : par defaut expect(querySelectorAll('.kt-checkbox-error-message').length).toBe(1) ; avec showAllErrors=true -> .toBe(2).
  - preuve: Le host CheckboxHost (l.10-21) ne lie pas showAllErrors et ne fournit jamais plus d'une erreur ; 'showAllErrors' est absent de checkbox.spec.ts. La branche slice(0,1) avec N>1 et la branche showAllErr

## checkbox-group (11)

- **[a11y]** aria-required='true' sur role=group + astérisque dans la légende quand required
  - source: `checkbox-group.ts:48 et :56-57 (input required ligne 93)`
  - assert: host.required.set(true); fixture.detectChanges(); expect(el.querySelector('[role=group]')?.getAttribute('aria-required')).toBe('true'); expect(el.querySelector('.kt-checkbox-group\_\_required')?.getAttribute('aria-hidden')).toBe('true')
  - preuve: host.required = signal(false) (spec:36) n'est jamais mis a true ; aucune occurrence de 'aria-required' ni '\_\_required' dans checkbox-group.spec.ts. L'e2e choice.spec.ts teste aria-required seulement s
- **[a11y]** Nom accessible de repli via aria-label quand label absent (aria-labelledby devient null)
  - source: `checkbox-group.ts:45-46 (input ariaLabel ligne 113, resolvedAriaLabel ligne 148)`
  - assert: Avec label=undefined et ariaLabel fourni : expect(group.getAttribute('aria-label')).toBe('...'); expect(group.getAttribute('aria-labelledby')).toBeNull(); expect(el.querySelector('.kt-checkbox-group\_\_legend')).toBeNull()
  - preuve: GroupHost passe label=signal('Centres') (spec:32) et ObjectGroupHost label="Tags" (spec:44) ; aucun host ne met label a undefined ni ne fournit ariaLabel. Aucune occurrence de 'aria-label' (sans -ledb
- **[a11y]** aria-describedby pointe vers le hint quand hint fourni et pas d'erreur affichee
  - source: `checkbox-group.ts:47 + :66-67 + :150-155`
  - assert: Avec hint fourni : expect(el.querySelector('.kt-checkbox-group**hint')?.id).toBe(group.getAttribute('aria-describedby')); expect(el.querySelector('.kt-checkbox-group**hint')?.textContent).toContain('...')
  - preuve: Le template hote (spec:15-23 et :44) n'expose aucun input [hint] ; le mot 'hint' est totalement absent de checkbox-group.spec.ts. L'e2e n'asserte aucun aria-describedby (absent de choice.spec.ts).
- **[a11y]** Bascule de aria-describedby du hint vers errorId quand le groupe devient invalide (hint masque)
  - source: `checkbox-group.ts:66 (masquage hint) + :150-155 (describedBy errorId) + :69 (errorId)`
  - assert: Groupe invalide+touched+hint : expect(group.getAttribute('aria-describedby')).toBe(el.querySelector('.kt-checkbox-group**error')?.id); expect(el.querySelector('.kt-checkbox-group**hint')).toBeNull()
  - preuve: Le test 'shows group-level errors only after touched' (spec:139-150) verifie uniquement le textContent du message ; aucune occurrence de 'aria-describedby' dans tout le spec, et 'hint' absent donc la
- **[a11y]** focus() ignore les cases desactivees via :not([disabled]) — focalise la premiere ACTIVABLE
  - source: `checkbox-group.ts:167-169`
  - assert: Premiere case disabled : group.focus(); expect(document.activeElement).toBe(inputs(el)[1])
  - preuve: Le test focus() (spec:124-129) asserte activeElement === inputs[0], qui est activable ; aucun test ne met la premiere case en disabled avant focus(), donc le filtre :not([disabled]) n'est jamais reell
- **[a11y]** aria-live='polite' sur le conteneur d'erreur (live region)
  - source: `checkbox-group.ts:69`
  - assert: expect(el.querySelector('.kt-checkbox-group\_\_error')?.getAttribute('aria-live')).toBe('polite')
  - preuve: 'aria-live' est totalement absent de checkbox-group.spec.ts et de choice.spec.ts ; aucun test ne lit le conteneur '.kt-checkbox-group**error' (seul '.kt-checkbox-group**error-message' est interroge).
- **[correctness]** showAllErrors : une seule erreur par defaut (slice 0,1) vs toutes avec le flag
  - source: `checkbox-group.ts:144-146 (input showAllErrors ligne 117-119)`
  - assert: Avec 2 erreurs et invalide+touched : par defaut expect(querySelectorAll('.kt-checkbox-group\_\_error-message').length).toBe(1) ; avec showAllErrors=true expect(...).toBe(2)
  - preuve: Tous les host.errors.set(...) du spec (l.141, 154, 162) passent un tableau d'UN seul element ; 'showAllErrors' totalement absent du spec ; aucun querySelectorAll sur error-message (seulement querySele
- **[correctness]** toggle() est un no-op et ne marque PAS touched quand disabled() (guard ligne 173 avant touched.set ligne 182)
  - source: `checkbox-group.ts:172-183 (guard ligne 173)`
  - assert: group.toggle('data', true) sur groupe disabled (appel direct) : expect(host.value()).toEqual(['tech']) et touched inchange
  - preuve: Le test 'disables every box' (spec:108-116) declenche un input.click() inerte (l'input est disabled au DOM, le change natif ne part pas) ; toggle() n'est jamais appele directement dans le spec, et l'e
- **[edge]** toggle() idempotent : re-cocher une option presente n'ajoute pas de doublon, decocher une absente ne fait rien
  - source: `checkbox-group.ts:176-181`
  - assert: group.toggle('tech', true) avec value=['tech'] : expect(host.value()).toEqual(['tech']) ; group.toggle('data', false) avec 'data' absent : value inchangee
  - preuve: toggle() n'est jamais appele directement dans le spec ; les seuls toggles passent par input.click() qui inverse toujours l'etat reel, donc les branches 'checked && exists' et '!checked && !exists' ne
- **[edge]** Robustesse value null/undefined : isSelected() et toggle() tolerent value null (?? [])
  - source: `checkbox-group.ts:161 et :174`
  - assert: host.value.set(null as never); fixture.detectChanges(); expect(inputs(el).every(i => !i.checked)).toBe(true); puis cocher une case : expect(host.value()).toEqual([...]) sans crash
  - preuve: value est toujours initialise a un tableau (signal(['tech']) spec:31, signal([]) spec:57) et jamais mis a null/undefined ; 'null' / 'undefined' ne sont jamais passes a value dans le spec ni l'e2e.
- **[edge]** id impose propage des ids deterministes (labelId/hintId/errorId derives de id())
  - source: `checkbox-group.ts:107 (input id) + :128-131`
  - assert: Avec id='ints' : expect(el.querySelector('.kt-checkbox-group\_\_legend')?.id).toBe('ints-label') et expect(group.getAttribute('aria-labelledby')).toBe('ints-label')
  - preuve: Aucun host ne passe l'input [id] (absent des templates spec:15-27 et :44) ; le mot 'id=' impose n'apparait pas. Le test l.82 compare aria-labelledby a legend.id mais sans prefixe deterministe impose (

## select (10)

- **[a11y]** Option désactivée (optionDisabled) : non sélectionnable au clic/clavier et exposée comme telle (aria-disabled). UserKeyHost câble [optionDisabled]="userDisabled" qui marque Grace désactivée mais aucune assertion ne le vérifie.
  - source: `select.html:124-126 ([disabled]=disabledOf) ; base-select.ts:234 disabledOf ; spec UserKeyHost l.100-106`
  - assert: Popup ouvert : expect(li[label="Grace"].getAttribute('aria-disabled')).toBe('true') ; puis onListboxValueChange([3]) ne change pas host.value() et n'émet pas selectionChange.
  - preuve: select.spec.ts ne contient aucune occurrence de 'aria-disabled' ni de disabledOf hors signature ; le bloc 'objets — mode clé' (l.218-253) teste seulement la sélection d'options actives (id 1 et 2), ja
- **[a11y]** État readonly : [readonly]=readonly() poussé sur le <ul ngListbox> (sélection figée, aria-readonly attendu).
  - source: `select.html:116 et 167 ([readonly]="readonly()") ; base-select.ts:101`
  - assert: Host [readonly]=true : ouvrir le popup, expect(listbox.getAttribute('aria-readonly')).toBe('true') et onListboxValueChange(['Banane']) laisse host.value() inchangé ; e2e sur l'exemple « Lecture seule ».
  - preuve: Dans select.spec.ts le mot 'readonly' n'apparaît qu'à la ligne 'readonly unknown[]' (signature de SelectInternals l.23) et 'readonly User[]' (l.14) — aucun host ni assertion readonly. select.spec.ts e
- **[a11y]** Attribut data-invalid sur le trigger quand showInvalid() (invalid && touched par défaut), pilotant l'affichage d'erreur du Field.
  - source: `select.html:27 ([attr.data-invalid]) ; base-select.ts:183-185 showInvalid`
  - assert: Host [invalid]=true [touched]=true : expect(trigger.getAttribute('data-invalid')).toBe('') ; avec touched=false expect(...).toBeNull().
  - preuve: select.spec.ts n'assertе que data-pending/aria-busy (l.210-215 : 'reflète le pending via aria-busy et data-pending') ; aucune occurrence de 'data-invalid' ni de 'showInvalid' ni d'un host posant [inva
- **[a11y]** Câblage aria-describedby du trigger (ktFieldControl) vers le hint / le message d'erreur projetés dans kt-field.
  - source: `select.html:2-7 (hint/errors/customDescribedBy passés à kt-field) ; select.html:21 ktFieldControl`
  - assert: Host avec label+hint : expect(trigger.getAttribute('aria-describedby')).toBeTruthy() et l'id pointé contient le texte du hint ; en état invalide, qu'il pointe le conteneur d'erreur.
  - preuve: select.spec.ts ne contient aucune occurrence de 'aria-describedby' ; PrimitiveHost ne passe même pas de [hint]. Le seul aria-describedby-like testé est l'aria-controls du filtre (l.420), pas l'aria-de
- **[a11y]** Cibles tactiles ≥44px des options en bottom-sheet mobile (WCAG 2.5.5) et focusabilité réelle des options en focusMode 'roving' sur compact non-filtrable.
  - source: `select.ts doc ≥44px ; base-select.ts:289-290 (roving) ; select.html:159 focusMode roving`
  - assert: Sheet ouverte : box = await page.locator('.kt-select\_\_option').first().boundingBox() ; expect(box.height).toBeGreaterThanOrEqual(44) ; et après .focus()+ArrowDown sur une option en roving, document.activeElement est l'option suivante.
  - preuve: select.mobile.spec.ts : grep 'boundingBox' renvoie seulement la mesure du popup (l.42-51 plein-largeur/collé-en-bas), du header/input (l.126-128) et du grab (l.84) — jamais '.kt-select\_\_option' ; aucu
- **[correctness]** Templates personnalisés option (ktSelectOption) ET trigger (ktSelectTrigger) : le contenu projeté remplace le libellé par défaut et le contexte expose selected/active.
  - source: `select.html:34-41 (triggerDef) ; select.html:128-139 et 179-187 (optionDef + ngTemplateOutletContext {selected,active})`
  - assert: Host projetant <ng-template ktSelectTrigger> : le trigger rend le markup custom pour la valeur courante et le placeholder quand null ; host projetant <ng-template ktSelectOption let-selected> : l'option sélectionnée rend le marqueur custom (assert sur le DOM de l'option).
  - preuve: select.spec.ts ne contient aucune occurrence de 'ktSelectOption' ni 'ktSelectTrigger' ni 'triggerDef'/'optionDef' ; aucun des 7 hosts (PrimitiveHost…TruncatedHost) ne projette de ng-template. e2e : gr
- **[correctness]** Fermeture au clic/tap extérieur (handler document:pointerdown hors zone Angular) et au tap sur le scrim de la sheet — chemin distinct d'Échap/Tab/bouton.
  - source: `base-select.ts:355-364 (onPointerDown extérieur) ; select.html:50 (scrim click → expanded.set(false))`
  - assert: Desktop e2e : popup ouvert, cliquer document.body hors composant → popup masqué. Mobile e2e : sheet ouverte, taper .kt-select\_\_sheet-scrim → popup masqué + focus rendu au trigger.
  - preuve: select.spec.ts e2e ferme via clic-option (l.37), Enter (l.53), Escape (l.67), Tab (l.155) — jamais via clic hors composant ('body' = 0 hit pertinent). select.mobile.spec.ts ne teste le scrim que pour
- **[edge]** Mode objet, valeur absente des options : selectedOption() retombe sur la valeur brute (v as T) et le trigger affiche labelOf(v) au lieu du placeholder.
  - source: `select.ts selectedOption (branche fallback) ; base-select labelOf l.228`
  - assert: UserObjHost : host.value.set({id:99,name:'Inconnu',role:'X'}) (absent de USERS) puis expect(valueText(el)).toBe('Inconnu').
  - preuve: Le bloc 'objets — mode objet' (select.spec.ts l.255-280) ne pose que des valeurs présentes dans USERS : l.270 {id:3,name:'Grace',...} (existe) et l.275-278 onListboxValueChange([1]). Aucune valeur orp
- **[edge]** Override par input du texte/annonce de troncature (truncatedResultsText / truncatedResultsAnnouncement), prioritaire sur KT_SELECT_CONFIG.
  - source: `base-select.ts:204-213 (resolvedTruncatedResultsText/Announcement = input ?? config ?? défaut) ; select.html:148`
  - assert: TruncatedHost avec [truncatedResultsText]=fn custom : expect('.kt-select\_\_truncated-info'.textContent) reflète le texte custom (et non 'Showing first…').
  - preuve: TruncatedHost (select.spec.ts l.147-163) ne déclare que [maxVisibleOptions], jamais les inputs truncatedResultsText/Announcement ; les seules assertions de troncature (l.622 'Showing first 3 results o
- **[edge]** aria-controls du trigger pointant le panneau dialog (panelId) en mode filtrable.
  - source: `select.html:47 (popupType dialog) ; select.html:79-80 panelId ; aria-controls du trigger fourni par ngCombobox`
  - assert: Mode filtrable ouvert : expect(trigger.getAttribute('aria-controls')).toBe(panel.id) où panel = el.querySelector('[role="dialog"]').
  - preuve: Le test 'rend le champ de filtre avec son ARIA' (select.spec.ts l.412-425) assertе input.aria-controls===listbox.id (l.420), panel.id contient 'kt-select-panel-' (l.422) et trigger.aria-haspopup==='di

## tooltip (10)

- **[a11y]** popover="manual" jamais asserté sur l'élément tooltip (attribut + appel showPopover()).
  - source: `tooltip.ts:221 (ensureTip, setAttribute 'popover' 'manual')`
  - assert: expect(currentTip()?.getAttribute('popover')).toBe('manual') après affichage
  - preuve: tooltip.spec.ts:67-72 mocke showPopover/hidePopover pour basculer data-open ; aucune occurrence de getAttribute('popover') ni de la chaîne 'manual' dans tooltip.spec.ts. e2e/tooltip.spec.ts ne mention
- **[a11y]** warnIfInteractive : console.warn sur contenu interactif (et absence sur contenu non interactif) jamais asserté.
  - source: `tooltip.ts:287-297 (warnIfInteractive)`
  - assert: spy sur console.warn ; projeter un TemplateRef avec <button> et expect(warnSpy) appelé avec /role="tooltip".\*interactif/ ; non appelé pour contenu non interactif
  - preuve: Aucun spyOn(console,'warn') dans tooltip.spec.ts ; le TemplateRef #rich (l.18-24) ne contient que strong/ul/li (non interactif) et n'est jamais vérifié vis-à-vis du warn. e2e ne touche pas console.war
- **[a11y]** aria-describedby retiré du trigger après fermeture (mouseleave/Échap), pas seulement absent quand disabled/vide.
  - source: `tooltip.ts:112 (describedById dépend de isShown)`
  - assert: après affichage puis mouseleave + hideDelay : expect(trigger.hasAttribute('aria-describedby')).toBe(false)
  - preuve: tooltip.spec.ts n'assertе hasAttribute('aria-describedby')===false que dans les cas disabled (l.285) et whitespace (l.294), jamais après une fermeture depuis l'état affiché. e2e/tooltip.spec.ts:24 n'e
- **[correctness]** Position 'left' et 'right' jamais vérifiées via data-position.
  - source: `tooltip.ts:251 (syncContent, data-position) ; tooltip.ts:85 input tooltipPosition`
  - assert: pour position 'left' et 'right', expect(currentTip()?.getAttribute('data-position')).toBe('left'|'right')
  - preuve: tooltip.spec.ts:103-107 n'exerce que 'top' puis 'bottom' ; les littéraux 'left'/'right' n'apparaissent nulle part dans tooltip.spec.ts. e2e n'assertе aucun data-position.
- **[correctness]** Cascade de résolution provideKtTooltip / KT_TOOLTIP_CONFIG (config -> défaut) non testée.
  - source: `tooltip.ts:46-48 (provideKtTooltip) ; tooltip.ts:85,89,91 (input defaults via this.config?.x)`
  - assert: providers:[provideKtTooltip({position:'bottom', showDelay:300})] : afficher et expect data-position 'bottom' + tip absent avant 300ms
  - preuve: Aucune occurrence de 'provideKtTooltip' ni 'KT_TOOLTIP_CONFIG' dans tooltip.spec.ts ; le TestBed (l.43) n'enregistre aucun provider. e2e n'utilise pas le provider.
- **[correctness]** Valeurs par défaut des délais (showDelay 150 / hideDelay 100) jamais exercées.
  - source: `tooltip.ts:89 (showDelay default 150) ; tooltip.ts:91 (hideDelay default 100)`
  - assert: sans binding de délai : après mouseenter + advanceTimersByTime(149) tip absent ; après 150 il apparaît
  - preuve: Le host force showDelay=100/hideDelay=100 (tooltip.spec.ts:33-34) et tous les tests font advanceTimersByTime(100) ; le littéral 150 n'apparaît jamais et aucun test ne déclenche la directive sans bindi
- **[correctness]** Ancrage CSS : anchor-name sur le trigger et position-anchor sur le tip jamais assertés.
  - source: `tooltip.ts:139 (host anchor-name) ; tooltip.ts:224 (tip position-anchor)`
  - assert: expect(trigger.style.getPropertyValue('anchor-name')).toMatch(/^--kt-tooltip-anchor-\d+$/) et position-anchor du tip identique
  - preuve: Les chaînes 'anchor-name' et 'position-anchor' sont absentes de tooltip.spec.ts et de e2e/tooltip.spec.ts ; aucun accès à trigger.style ni tip.style.
- **[edge]** onEscape : branche 'rien affiché' (guard isShown(), ne stoppe pas la propagation) non exercée.
  - source: `tooltip.ts:200-206 (onEscape : if(!this.isShown()) return)`
  - assert: tooltip non affiché, dispatch Escape : expect(stopPropagationSpy).not.toHaveBeenCalled()
  - preuve: tooltip.spec.ts:249-261 ne teste l'Échap qu'après affichage (focusin + advance 100) avec stopPropagation appelé ; aucun test ne dispatch Escape alors que isShown()===false pour vérifier l'absence de s
- **[edge]** Fermeture quand on quitte le tooltip lui-même : mouseleave sur le tip -> hide.
  - source: `tooltip.ts:230-231 (listen tip mouseenter clearTimeout / mouseleave hide)`
  - assert: après entrée dans le tip, dispatch mouseleave sur le tip + advance hideDelay : expect(currentTip()).toBeNull()
  - preuve: tooltip.spec.ts:228-243 ne dispatch que mouseenter sur le tip et assertе qu'il reste ouvert ; aucun dispatchEvent(new MouseEvent('mouseleave')) sur l'élément tip. e2e ne couvre pas ce cas.
- **[edge]** Annulation anti-flicker : mouseenter puis mouseleave avant showDelay ne doit jamais afficher le tip.
  - source: `tooltip.ts:177 (showTimer) ; tooltip.ts:193 (hide -> clearTimeout(showTimer))`
  - assert: mouseenter puis mouseleave avant la fin du showDelay, advance tous les timers : expect(currentTip()).toBeNull()
  - preuve: Tous les tests show/hide de tooltip.spec.ts font advanceTimersByTime(100) (delai complet) après mouseenter avant tout mouseleave (l.199-243) ; aucun n'enchaîne mouseenter -> mouseleave avant l'expirat

## multi-select (10)

- **[a11y]** État invalide : data-invalid='' sur le trigger + rendu du message d'erreur via kt-field quand showInvalid() (invalid && touched) est vrai, et raccordement de l'id d'erreur dans aria-describedby.
  - source: `multi-select.html:28 (data-invalid) + :7-8 ([errors]=fieldErrors(), [invalid]=showInvalid()) ; demo multi-select-demo.html:60 (carte « Invalide » [invalid]=true [touched]=true [errors]=demoErrors)`
  - assert: Host avec [invalid]=true [touched]=true [errors]=[{kind:'custom',message:'…'}] : expect(trigger.getAttribute('data-invalid')).toBe('') ET expect(el.querySelector('.kt-field\_\_error')?.textContent).toContain('…') ET l'id de l'erreur figure dans trigger.getAttribute('aria-describedby').
  - preuve: grep data-invalid|fieldErrors|kt-field**error|aria-describedby sur multi-select.spec.ts → 0 ; e2e (grep data-invalid|Invalide|kt-field**error) → 0 ; aucun host de test ne lie [invalid]/[errors]. La ca
- **[a11y]** État pending (validation async) : aria-busy='true' et data-pending='' sur le trigger quand pending() est vrai, retour à null quand faux.
  - source: `multi-select.html:31-32 ([attr.data-pending] / [attr.aria-busy]="pending() ? 'true' : null")`
  - assert: Host liant [pending]=signal(true) : expect(trigger.getAttribute('aria-busy')).toBe('true') et expect(trigger.getAttribute('data-pending')).toBe('') ; repasser à false → les deux attributs à null.
  - preuve: grep pending|aria-busy|data-pending sur multi-select.spec.ts → 0 ; sur e2e → 0 ; aucun host ne lie [pending] et il n'existe aucune carte démo « pending » (multi-select-demo.html n'a aucun exemple asyn
- **[a11y]** Option désactivée : ngOption [disabled]=disabledOf(item) produit aria-disabled='true' sur le <li> et onListboxValueChange ne committe pas sa clé.
  - source: `multi-select.html:159 / :221 ([disabled]="disabledOf(item)") + base-select disabledOf`
  - assert: Ouvrir le popup (host à options désactivées) : expect(li de l'option disabled.getAttribute('aria-disabled')).toBe('true') ; cliquer/tap dessus → host.value() inchangé.
  - preuve: Le seul usage de disabled dans le spec est une présélection objet (spec.ts:345, value.set d'un clone disabled) — aucun popup ouvert pour inspecter l'état DOM d'un <li> désactivé ; grep aria-disabled s
- **[a11y]** Mode panneau (dialogMode) : le widget porte role='dialog' + aria-label=label, et l'input filtre câble aria-controls=lb.id() et aria-activedescendant.
  - source: `multi-select.html:89-99 (role='dialog', aria-label) et :118-123 (aria-controls=lb.id(), aria-activedescendant)`
  - assert: Panneau filtrable ouvert : expect(panel.getAttribute('role')).toBe('dialog'), expect(panel.getAttribute('aria-label')).toBe('Compétences') ; expect(filterInput.getAttribute('aria-controls')) non vide et = id du <ul>.
  - preuve: grep 'role="dialog"'|aria-controls sur e2e → 0 ; les tests filtre/actions (e2e:125-165) n'assertent que le focus de l'input et le comptage d'options ; rien en unit n'inspecte role/aria-controls du pan
- **[correctness]** Sélection de plage via Shift+Espace et Ctrl/Cmd+Shift+Home/End relayés par onTriggerKeydown : preventDefault + re-dispatch d'un keydown sur le listbox, seulement si expanded && !compact.
  - source: `multi-select.ts:218-236 (onTriggerKeydown)`
  - assert: E2E : ouvrir, ArrowDown pour ancrer, Shift+Space → expect(.kt-chip count 2) (plage ancre→active), popup reste visible ; Ctrl+Shift+End → toutes les options de l'ancre à la fin sélectionnées.
  - preuve: e2e ne teste que Shift+ArrowDown natif (multi-select.spec.ts:106, qui ne passe pas par onTriggerKeydown) ; grep 'Shift+Space'|'Control+Shift'|'Ctrl+Shift' sur e2e → 0 ; l'interface MultiSelectInternal
- **[correctness]** selectAllFiltered exclut les options désactivées (filter !disabledOf) : une option disabled n'entre jamais dans la valeur via « Tout sélectionner ».
  - source: `multi-select.ts:294-304 (selectAllFiltered, garde !this.disabledOf(o))`
  - assert: Host avec selectionActions ET optionDisabled (une option disabled) : cliquer « Select all » → expect(host.value()).not.toContain(<clé option disabled>) et longueur = nb options activées.
  - preuve: BulkHost (spec.ts:143-160) n'a aucune option disabled (tags tous activés) ; UserKeyHost câble optionDisabled mais SANS selectionActions, donc selectAllFiltered n'y est jamais invoqué ; le test « Tout
- **[correctness]** onPanelKeydown ne re-forwarde au listbox QUE si event.target === currentTarget (les keydown internes qui bubblent ne sont pas re-dispatchés).
  - source: `multi-select.ts:241-254 (onPanelKeydown, garde target !== currentTarget)`
  - assert: Panneau dialog ouvert : dispatch keydown ArrowDown avec target=widget div → une .kt-select\_\_option--active apparaît ; dispatch depuis un enfant (bubbling) → aucun second changement (active inchangé).
  - preuve: onPanelKeydown n'est pas dans MultiSelectInternals (spec.ts:21-30) ni déclenché en e2e (la navigation testée passe par l'input/onFilterKeydown, pas par le div widget) ; la garde target===currentTarget
- **[edge]** État vide du listbox : filtre sans résultat → <li.kt-select\_\_empty role='option' aria-disabled='true'> rendant resolvedEmptyText() ('No options').
  - source: `multi-select.html:184-188 / :246-250 (@empty → .kt-select__empty)`
  - assert: Après filtre sans résultat : expect(el.querySelector('.kt-select\_\_empty')?.textContent?.trim()).toBe('No options') et getAttribute('aria-disabled')==='true'.
  - preuve: e2e tape 'zzz' et n'asserte que .kt-select**option toHaveCount(0) puis AXE (multi-select.spec.ts:222-225) — jamais la présence/texte du li vide ; grep kt-select**empty|'No options' sur les deux specs
- **[edge]** data-filled posé sur le trigger dès qu'une sélection existe (selectedOptions().length).
  - source: `multi-select.html:30 ([attr.data-filled]="selectedOptions().length ? '' : null")`
  - assert: Sans sélection : expect(trigger.getAttribute('data-filled')).toBeNull() ; après value.set([...]) : expect(trigger.getAttribute('data-filled')).toBe('').
  - preuve: grep data-filled sur multi-select.spec.ts et e2e → 0 ; les tests de présence de sélection assertent des chips/valueText, jamais l'attribut data-filled du trigger.
- **[edge]** Payload selectionChange en mode OBJET : { value: objets entiers, options: objets } dans l'ordre — vérifier le tableau `options`, pas seulement `value`.
  - source: `multi-select.ts:210-214 (commitValue émet options: selectedOptions())`
  - assert: UserObjHost avec (selectionChange) capturé : après onListboxValueChange([1,2]) → expect(last().options).toEqual([USERS[0],USERS[1]]) ET last().value === objets entiers.
  - preuve: UserObjHost (spec.ts:111-119) ne branche aucun (selectionChange) ; le test mode objet (spec.ts:351-356) n'asserte que host.value() ; le payload complet n'est vérifié qu'en mode CLÉ (UserKeyHost, spec.

## chip-list (8)

- **[a11y]** Le bouton de repli passe à aria-expanded="true" une fois la liste dépliée. Les specs n'assertent que l'état replié (false).
  - source: `chip-list.html:30 ([attr.aria-expanded]="expanded()") + chip-list.ts:308 toggleExpanded`
  - assert: Après more.click() + detectChanges : expect(el.querySelector('.kt-chip-list\_\_more')!.getAttribute('aria-expanded')).toBe('true').
  - preuve: Unit chip-list.spec.ts:140 assert getAttribute('aria-expanded')==='false' ; après more.click() (142-147) les seules assertions sont chipLabels (145), textContent==='Show less' (146) et le focus (147)
- **[a11y]** La navigation au clavier (flèches/Home/End) atteint le bouton « +N more » inclus dans focusables de onKeydown ; franchissement chip -> more (et inverse) jamais vérifié.
  - source: `chip-list.ts:340 (sélecteur focusables inclut '.kt-chip-list__more') + chip-list.ts:331 onKeydown`
  - assert: Avec maxVisible(2) : focuser le dernier remove visible, ArrowRight, puis expect(document.activeElement).toBe(el.querySelector('.kt-chip-list\_\_more')) ; ArrowLeft re-focus le chip précédent.
  - preuve: Le seul test clavier (chip-list.spec.ts:211-248) part de setup() sans maxVisible (host.maxVisible défaut undefined ligne 37), donc overflow()===false et le bouton .kt-chip-list\_\_more n'est pas rendu (
- **[a11y]** Au retrait du DERNIER chip d'une liste de plusieurs, le focus retombe sur le chip précédent via le clamp Math.min(index, focusables.length - 1). La branche de clamp (index >= longueur restante) n'est jamais exercée.
  - source: `chip-list.ts:290 (target = focusables[Math.min(index, focusables.length - 1)])`
  - assert: Cliquer le dernier remove (removeButtons(el).at(-1)!.click()), whenStable, puis expect(document.activeElement).toBe(removeButtons(el).at(-1)).
  - preuve: Unit chip-list.spec.ts:101/108/111 cliquent toujours removeButtons(el)[0] (index 0) ; Math.min(0, ...) ne déclenche jamais le clamp. E2E chips.spec.ts:35 retire 'Retirer Angular' (1er) puis presse Ent
- **[a11y]** Quand le dernier chip est retiré SANS emptyFocusTarget fourni, emptyFocusTarget()?.focus() : aucun focus volé, aucune exception. La branche du chaînage optionnel (cible absente) n'est jamais couverte.
  - source: `chip-list.ts:295 (this.emptyFocusTarget()?.focus())`
  - assert: Host sans emptyFocusTarget, items=['X'] : cliquer le seul remove, whenStable, expect ne throw pas et document.activeElement reste body.
  - preuve: Le Host (chip-list.spec.ts:29) fournit toujours [emptyFocusTarget]="fallback()?.nativeElement", et le test de vidage (99-116) en dépend explicitement (ligne 115 assert activeElement===fallback). Le Cu
- **[correctness]** Input removable=false sur kt-chip-list : showRemove = removable() && !readonly() doit retirer tous les boutons « retirer » même hors readonly — branche distincte de readonly.
  - source: `chip-list.ts:144 (showRemove) + chip-list.ts:85 (removable input)`
  - assert: [removable]="false" sur la liste : expect(removeButtons(el)).toEqual([]) tout en gardant role=list et les labels de chips présents.
  - preuve: Le Host (chip-list.spec.ts:22-31) ne bind pas [removable] ; aucun signal removable n'existe sur le host. La seule suppression de boutons testée passe par readonly (154-158). En e2e, le seul cas sans b
- **[correctness]** Input [chipTemplate] (TemplateRef forwardé) comme source de rendu custom, et priorité du ng-template[ktChipItem] projeté sur ce chipTemplate dans effectiveTemplate.
  - source: `chip-list.ts:103 (chipTemplate input) + chip-list.ts:142 (effectiveTemplate = itemDef()?.template ?? chipTemplate())`
  - assert: Passer un TemplateRef via [chipTemplate] : expect rendu custom appliqué. Puis avec ktChipItem ET chipTemplate présents : expect le DOM du ktChipItem (projeté) prime.
  - preuve: Les deux tests custom (chip-list.spec.ts:170 et 250) utilisent uniquement <ng-template [ktChipItem]> projeté (template host 54). Aucun test ne bind l'input [chipTemplate] ; le branche ?? chipTemplate(
- **[edge]** itemLabel et itemKey fournis sous forme de FONCTION (KtKeyish via accessor) — branche distincte de la forme clé-string.
  - source: `chip-list.ts:81-83 (itemLabel/itemKey) + chip-list.ts:128-129 (labelAccessor/keyAccessor via accessor)`
  - assert: [itemLabel]="(u)=>u.first+' '+u.last" : expect(chipLabels(el)[0]) reflète la chaîne calculée par la fonction.
  - preuve: Le CustomTemplateHost (chip-list.spec.ts:53) bind itemLabel="name" itemKey="id" — forme clé-string. Le Host string (22-31) ne bind ni itemLabel ni itemKey (s'appuie sur defaultLabel/defaultIdentity).
- **[edge]** Inputs textuels directs (removeItemLabel, itemRemovedText, moreLabel, lessLabel) en tant que fonctions/valeurs, distincts de la résolution via KT_CHIPS_CONFIG.
  - source: `chip-list.ts:116-125 (resolved* : input ?? config ?? défaut)`
  - assert: [removeItemLabel]="(l)=>'Suppr '+l" + config FR présente : expect(removeButtons(el)[0].getAttribute('aria-label')).toBe('Suppr Pomme') (input > config).
  - preuve: Le test CHIPS_CONFIG (chip-list.spec.ts:184-209) fournit removeItemLabel/itemRemovedText/moreLabel uniquement via le provider KT_CHIPS_CONFIG (188-196), pas en input. Le seul input texte direct du Hos

## tab-scroller (8)

- **[correctness]** Branche RTL de measure() : fromStart = -scrollLeft et fromEnd = max - Math.abs(scrollLeft) quand isRtl() est vrai. canScrollStart/canScrollEnd doivent rester corrects malgré scrollLeft négatif.
  - source: `tab-scroller.ts:170-177 (measure, branche rtl) et isRtl() 185-187`
  - assert: Mock getComputedStyle().direction='rtl', mockScrollLeft=-250 (max 500), dispatch 'scroll', expect(dir.canScrollStart()).toBe(true) ET expect(dir.canScrollEnd()).toBe(true).
  - preuve: Grep insensible à la casse de rtl|direction|getComputedStyle dans tab-scroller.spec.ts = aucun résultat ; idem dans e2e/tabs.spec.ts. isRtl() lit getComputedStyle(this.list).direction, jamais mocké →
- **[correctness]** Branche RTL de scrollByPage : rtlSign=-1 → scrollByPage('end') doit produire un left négatif en RTL et 'start' un left positif.
  - source: `tab-scroller.ts:149-151 (rtlSign dans scrollByPage)`
  - assert: En contexte RTL, scrollByPage('end') → expect(scrollBySpy).toHaveBeenCalledWith({ left: -240, behavior: 'smooth' }) et 'start' → left: +240.
  - preuve: Les 4 tests scrollByPage (tab-scroller.spec.ts:260-283) sont tous en LTR : left:240, left:-240, top:240, left:240. Aucun ne mocke direction='rtl', donc rtlSign vaut toujours 1. Aucun autre spec n'appe
- **[correctness]** MutationObserver : à l'ajout/retrait d'onglets via @for, le callback appelle observeAll() puis remeasure(). Le re-calcul des métriques après mutation du childList n'est jamais déclenché.
  - source: `tab-scroller.ts:123-127 (MutationObserver: observeAll() + remeasure())`
  - assert: Monter sans débordement (mockScrollWidth=200), host.tabs.set([...plus d'onglets]) + detectChanges, mockScrollWidth=800, laisser jouer le MutationObserver, puis expect(dir.overflowing()).toBe(true).
  - preuve: Le signal tabs n'est défini qu'au setup (avant montage) dans tous les hosts ; aucun test n'appelle host.tabs.set/update après whenStable. remeasure n'est exercé que via dispatch 'scroll' (spec:232) et
- **[correctness]** Branche verticale de measure() : canStart = scrollTop > EPS, canEnd = scrollTop < max - EPS. canScrollStart()/canScrollEnd() dérivés de scrollTop ne sont jamais vérifiés après un scroll vertical.
  - source: `tab-scroller.ts:164-167 (branche vertical de measure)`
  - assert: Sur VerticalHost, mockScrollTop=500 (max=scrollHeight800−clientHeight300=500... ajuster pour milieu), dispatch 'scroll', expect(dir.canScrollStart()).toBe(true) et expect(dir.canScrollEnd()).toBe(false).
  - preuve: VerticalHost ne teste que orientation() (spec:250-253) et le scroll-into-view vertical (spec:188-192). Le seul test remesure-après-scroll (spec:227-236) est sur HorizontalHost (mockScrollLeft). Aucune
- **[edge]** scrollByPage('start') sur l'axe vertical : sign=-1 applique top négatif. Seul 'end' vertical (top:240) est testé.
  - source: `tab-scroller.ts:145-147 (branche vertical de scrollByPage, sign négatif)`
  - assert: Sur VerticalHost, scrollByPage('start') → expect(scrollBySpy).toHaveBeenCalledWith({ top: -240, behavior: 'smooth' }).
  - preuve: tab-scroller.spec.ts:272-276 est l'unique test scrollByPage vertical et ne couvre que 'end' (top:240). Aucune occurrence de top:-240 dans le fichier.
- **[edge]** Nettoyage à la destruction : onDestroy retire le listener 'scroll' et appelle ro.disconnect()+mo.disconnect(). Après destroy, un scroll ne doit plus remesurer.
  - source: `tab-scroller.ts:129-133 (destroyRef.onDestroy)`
  - assert: Capturer dir, fixture.destroy(), changer mockScrollLeft puis dispatch 'scroll' : la valeur de dir.canScrollEnd() ne doit pas changer ; ou spyer removeEventListener et asserter removeEventListener('scroll', …).
  - preuve: Aucun test des 3 specs n'appelle fixture.destroy() suivi d'un re-déclenchement scroll/resize, ni ne spye add/removeEventListener. Le chemin onDestroy n'est jamais exercé.
- **[edge]** Tolérance EPS (1px) aux extrémités : > EPS / < max - EPS. À exactement 1px du bord, le côté est NON scrollable ; à 2px, scrollable. La frontière n'est jamais exercée.
  - source: `tab-scroller.ts:35 (EPS) et 167/176 (> EPS / < max - EPS)`
  - assert: mockScrollLeft=1 + dispatch 'scroll' → expect(dir.canScrollStart()).toBe(false) ; mockScrollLeft=2 → expect(dir.canScrollStart()).toBe(true).
  - preuve: Les tests de métriques utilisent mockScrollLeft 0 (spec:218-224) ou 500 (spec:231), et mockScrollWidth 200/800 — jamais une valeur sub-pixel ou exactement EPS=1. La frontière > EPS n'est testée par au
- **[edge]** scroll-into-view vertical quand l'onglet sélectionné est AVANT la vue (selectedTop < containerTop → value = selectedTop, remontée). Seule la branche 'après la vue' (selectedBottom > containerBottom, top:200) est testée en vertical.
  - source: `tab-scroller.ts:213 (branche selectedTop < containerTop)`
  - assert: Sur VerticalHost, mockScrollTop=400 et onglet sélectionné offsetTop=0 (selected='a'), expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' }).
  - preuve: Le seul scroll-into-view vertical (spec:188-192) sélectionne 'd' (offsetTop=400) avec mockScrollTop=0 → branche selectedBottom>containerBottom (top:200). mockScrollTop reste 0 dans tous les tests, don

## switch (8)

- **[a11y]** Le bouton role=switch n'expose jamais aria-describedby vers le hint ou l'erreur. La cascade describedBy() (joint hintId puis errorId selon showInvalid) n'est jamais vérifiée : aucun test ne lit l'attribut aria-describedby du bouton, ni la bascule hint->erreur du lien sémantique.
  - source: `switch.ts:50 ([attr.aria-describedby]="describedBy()") + describedBy() lignes 153-158`
  - assert: Hint seul : expect(button().getAttribute('aria-describedby')).toBe(hintElement()!.id). Apres click invalide : expect(button().getAttribute('aria-describedby')).toBe(el.querySelector('.kt-switch-error')!.id) et que l'id du hint n'y figure plus.
  - preuve: switch.spec.ts ne contient aucune occurrence de 'aria-describedby' ni de 'describedBy' ; seul aria-labelledby est teste (ligne 71). e2e/choice.spec.ts ne reference aucun describedby.
- **[a11y]** aria-required='true' sur le bouton role=switch quand required est vrai (attribut ARIA distinct du marqueur visuel '\*'). Cas negatif required=false -> aria-required null.
  - source: `switch.ts:52 ([attr.aria-required]="required() ? 'true' : null")`
  - assert: host.required.set(true); fixture.detectChanges(); expect(button().getAttribute('aria-required')).toBe('true'); cas negatif required=false -> expect(button().getAttribute('aria-required')).toBeNull().
  - preuve: switch.spec.ts:120-124 n'assert QUE el.querySelector('.kt-switch-label\_\_required') (marqueur visuel) ; 'aria-required' n'apparait nulle part dans switch.spec.ts. e2e/choice.spec.ts:42-45 teste aria-re
- **[a11y]** Nom accessible via ariaLabel quand label est absent : resolvedAriaLabel() pose aria-label, aria-labelledby doit etre null et aucun <label> rendu (WCAG 4.1.2). Branche label-absent/ariaLabel-present jamais exercee.
  - source: `switch.ts:48-49 (aria-label / aria-labelledby) + resolvedAriaLabel() ligne 151`
  - assert: label undefined, ariaLabel='Mode sombre' : expect(button().getAttribute('aria-label')).toBe('Mode sombre'); expect(button().getAttribute('aria-labelledby')).toBeNull(); expect(labelElement()).toBeNull().
  - preuve: Le host (switch.spec.ts:10-20) ne lie pas [ariaLabel] et label() vaut toujours 'Activer notifications' (ligne 25) ; 'ariaLabel' n'apparait pas dans le spec. Tous les switches e2e utilisent un name iss
- **[correctness]** Suppression de message via { message: '' } : le controle reste invalide (aria-invalid='true', classe --invalid) mais aucun texte d'erreur n'est rendu (resolveAll ecarte les messages vides) ; corollaire : describedBy() n'ajoute pas errorId car resolvedErrors() est vide.
  - source: `switch.ts:145 (resolvedErrors) + error-messages.ts:79 (saut message vide) + switch.ts:156 (errorId ajoute seulement si resolvedErrors().length>0)`
  - assert: errors=[{kind:'required',message:''}], touched apres clic : expect(button().getAttribute('aria-invalid')).toBe('true'); expect(el.querySelector('.kt-switch-error-message')).toBeNull(); expect(button().getAttribute('aria-describedby')).toBeNull().
  - preuve: Les seuls errors du spec ont un message non vide 'Veuillez cocher cette case' (switch.spec.ts:144,154,168) ; aucun message:'' n'est passe.
- **[correctness]** Resolution du message d'erreur PAR DEFAUT quand le validateur ne fournit pas de message : { kind:'required' } sans message doit afficher le defaut resolu via KtFieldErrorResolver ('This field is required.' ou defaut FR configure).
  - source: `switch.ts:145 (resolvedErrors via resolveAll) + error-messages.ts:64-83 (resolve/resolveAll, defaut required)`
  - assert: errors=[{kind:'required'}] sans message, touched apres clic : expect(errorContainer()?.textContent).toContain('This field is required.').
  - preuve: Tous les errors du spec fournissent un message explicite (switch.spec.ts:144,154,168) ; aucune erreur sans champ message n'est testee, donc la cascade error.message ?? this.resolve(error) (error-messa
- **[correctness]** showAllErrors : par defaut une seule erreur affichee (slice(0,1)) ; showAllErrors=true affiche toutes. Les deux branches du ternaire displayedErrors() ne sont jamais exercees avec plusieurs erreurs.
  - source: `switch.ts:147-149 (displayedErrors = showAllErrors() ? resolvedErrors() : resolvedErrors().slice(0,1)) + input showAllErrors ligne 122`
  - assert: 2 erreurs + touched : par defaut expect(el.querySelectorAll('.kt-switch-error-message').length).toBe(1) ; puis showAllErrors=true -> length 2.
  - preuve: Le host (switch.spec.ts:10-20) ne lie pas [showAllErrors] et errors() ne contient jamais plus d'une erreur (un seul element a chaque set, lignes 144,154,168) ; 'showAllErrors' n'apparait pas dans le s
- **[correctness]** blur marque le controle touche et declenche l'affichage de l'erreur SANS clic (perte de focus clavier) via (blur)="touched.set(true)".
  - source: `switch.ts:57 ((blur)="touched.set(true)")`
  - assert: invalid+errors poses, puis button().dispatchEvent(new FocusEvent('blur')); fixture.detectChanges(); expect(button().getAttribute('aria-invalid')).toBe('true') et erreur visible, sans aucun clic.
  - preuve: switch.spec.ts ne dispatche jamais d'evenement 'blur' / FocusEvent ; touched n'est declenche que par button().click() / labelElement().click() (lignes 81,89,157).
- **[edge]** Spacebar ne bascule PAS quand disabled : toggle() retourne tot sur disabled, donc la garde disabled couvre aussi le chemin clavier.
  - source: `switch.ts:176-185 (toggle() guard disabled, appele par onSpacebar)`
  - assert: disabled=true, dispatch keydown space sur le bouton, expect(host.value()).toBe(false) et expect(button().getAttribute('aria-checked')).toBe('false').
  - preuve: Le test Spacebar (switch.spec.ts:95-104) s'execute sur un switch non desactive ; le test disabled (106-118) n'exerce que click() et labelElement().click(), jamais un keydown space. e2e choice.spec.ts:

## menu (7)

- **[a11y]** Garde 'disabled' à l'activation d'un item à état : un ktMenuItemCheckbox/ktMenuItemRadio désactivé (ariaItem.disabled()===true) ne doit PAS basculer/sélectionner au clic ni au clavier.
  - source: `projects/ktortu/aaa/menu/menu-toggle.ts:78 et :158 — `if (this.ariaItem?.disabled()) return;` dans activate()`
  - assert: Monter un checkbox sur un vrai [ngMenuItem] avec [disabled]="true", cliquer puis dispatcher keydown Enter/Espace, et asserter que l'attribut DOM aria-checked reste 'false' (et le model inchangé) après chaque tentative.
  - preuve: CONFIRMÉ. Dans menu.spec.ts, CheckboxHost (ligne 22) et RadioHost (lignes 32-34) montent des <button> SANS [ngMenuItem] : ariaItem est donc null (inject AriaMenuItem optional, menu-toggle.ts:58/133) e
- **[a11y]** Activation CLAVIER d'un item radio : Entrée et Espace sélectionnent la valeur du radio (ACTIVATION_HOST câble click+enter+space pour supporter un hôte non-<button>).
  - source: `projects/ktortu/aaa/menu/menu-toggle.ts:127-130 (host ...ACTIVATION_HOST + aria-checked) et :157-163 activate()`
  - assert: Dispatcher new KeyboardEvent('keydown',{key:'Enter'}) puis {key:' '} sur radios[1], detectChanges, et asserter radios.map(r=>r.getAttribute('aria-checked')) === ['false','true','false'] (observable DOM, pas seulement host.value()).
  - preuve: CONFIRMÉ. Le bloc radio de menu.spec.ts (describe lignes 128-152) ne contient que deux it : 'should mark only...' (142, aucun événement) et 'should select on activation' (145-151) qui n'appelle QUE ra
- **[a11y]** L'item de sous-menu expose aria-haspopup et le parent passe aria-expanded à 'true' à l'ouverture latérale du sous-menu.
  - source: `projects/ktortu/aaa/menu/menu.ts:32-44 (item de sous-menu, attributs ARIA posés par aria) ; data-kt-submenu posé en menu.ts:81`
  - assert: En E2E après hover sur « Partager » : await expect(page.getByRole('menuitem',{name:'Partager'})).toHaveAttribute('aria-expanded','true') et toHaveAttribute('aria-haspopup','menu').
  - preuve: CONFIRMÉ (partiellement couvert ailleurs, assertion cible absente). menu.spec.ts:186 asserte data-kt-submenu sur la SURFACE du sous-menu (#sub), pas sur l'item parent. grep `aria-haspopup|aria-expande
- **[correctness]** Anti double-bascule : sur un keydown (Enter/Espace), activate() appelle event.preventDefault() pour neutraliser le click synthétique sur un <button> ; une seule bascule doit survenir.
  - source: `projects/ktortu/aaa/menu/menu-toggle.ts:79-81 (checkbox) et :159-161 (radio) — `if (event.type === 'keydown') event.preventDefault();` ; raison documentée lignes 27-37`
  - assert: Sur un checkbox initialement false : créer le KeyboardEvent avec cancelable:true, le dispatcher, et asserter event.defaultPrevented===true ; puis simuler la séquence native button (keydown suivi d'un click) et asserter que aria-checked vaut 'true' une seule fois (pas revenu à 'false').
  - preuve: CONFIRMÉ. grep `preventDefault|defaultPrevented` sur menu.spec.ts = 0 match. Les tests keydown du checkbox (lignes 111-125) créent l'event sans cancelable:true et n'assertent que l'état final une fois
- **[correctness]** Radio sans [ktMenuRadioGroup] parent : aria-checked reste 'false' (group?.value()===undefined) et l'activation est un no-op silencieux (group?.value.set non appelé), sans crash.
  - source: `projects/ktortu/aaa/menu/menu-toggle.ts:140 (`this.group?.value()===this.value()`) et :162 (`this.group?.value.set(...)`)`
  - assert: Monter un <button ktMenuItemRadio role="menuitemradio" [value]="'x'"> SANS [ktMenuRadioGroup], asserter aria-checked==='false' au départ, cliquer, puis re-asserter aria-checked==='false' (aucune exception levée).
  - preuve: CONFIRMÉ. L'unique hôte radio du spec, RadioHost (menu.spec.ts:28-40), enveloppe TOUJOURS ses radios dans `<div ktMenuRadioGroup>` (ligne 31). Aucun composant de test ne monte un [ktMenuItemRadio] hor
- **[correctness]** Garde-fous dev (console.warn) : ktMenuItemCheckbox/ktMenuItemRadio sans role=menuitemcheckbox/radio sur l'hôte, et ktMenuItemRadio hors d'un ktMenuRadioGroup, émettent un avertissement (sinon item muet pour les SR).
  - source: `projects/ktortu/aaa/menu/menu-toggle.ts:69-74, :142-149 et :151-154 — trois console.warn conditionnés par isDevMode()`
  - assert: Avec vi.spyOn(console,'warn'), monter un checkbox sans attribut role et asserter que warn a été appelé avec un message contenant 'menuitemcheckbox' ; symétriquement pour le radio hors groupe (message contenant 'ktMenuRadioGroup'). Vérifier l'absence d'appel quand le role est correct.
  - preuve: CONFIRMÉ. grep `console.warn` sur menu.spec.ts = 0 match : aucun spy. De plus tous les hôtes du spec sont 'corrects' (CheckboxHost ligne 22 a role="menuitemcheckbox" ; RadioHost lignes 32-34 ont role=
- **[edge]** Réinitialisation de l'ancrage de sous-menu : quand l'item perd son [submenu] (submenu() devient undefined), anchorName repasse à undefined (donc style.anchor-name retiré de l'item).
  - source: `projects/ktortu/aaa/menu/menu.ts:71-75 — `if (!submenu) { this.anchorName = undefined; return; }` dans l'effect`
  - assert: Rendre [submenu] conditionnel via un signal ; après ouverture asserter que parentItem.style.getPropertyValue('anchor-name') est non vide, puis basculer le signal pour retirer le sous-menu, detectChanges, et asserter que parentItem.style.getPropertyValue('anchor-name') redevient '' (vide).
  - preuve: CONFIRMÉ. SubmenuHost (menu.spec.ts:53-65) lie statiquement `[submenu]="sub"` (ligne 58) — jamais conditionnel ni piloté par un signal. Le seul it sous-menu (lignes 170-187) n'asserte que la POSE de l

## time-field (7)

- **[a11y]** Refocus de l'input natif après un clear (clear() → focus()).
  - source: `base-input.ts:182-186 (clear→focus) ; base-temporal-field.ts:76-80 (override clear)`
  - assert: Après clearBtn.click(): expect(document.activeElement).toBe(input()).
  - preuve: Le test clearable (lignes 71-81) n'asserte que host.value()===null (l.79) et input().value==='' (l.80). document.activeElement n'apparaît nulle part dans time-field.spec.ts.
- **[a11y]** readonly observable : l'input porte l'attribut readonly (et bouton clear masqué).
  - source: `time-field.html:42 [readOnly]=readonly() ; base-input.ts:55`
  - assert: host.readonly=true, detectChanges: expect(input().hasAttribute('readonly')).toBe(true) (et bouton effacer absent).
  - preuve: Le host (time-field.spec.ts:10-15) n'expose pas de signal readonly et ne le câble pas (l.8). Aucun test n'asserte readonly. En e2e, temporal.spec.ts:32 teste readonly uniquement sur kt-date-field (ex
- **[a11y]** disabled observable sur l'input + masquage du bouton clear quand disabled (showClear=clearable && !disabled).
  - source: `time-field.html:41 [disabled]=disabled() ; base-input.ts:123-125 (showClear exclut disabled)`
  - assert: host.disabled=true+clearable=true+value: expect(input().disabled).toBe(true) & querySelector('.kt-field-box\_\_clear')===null.
  - preuve: Le host ne câble pas disabled (time-field.spec.ts:8) et aucun signal disabled n'existe (l.10-15). Le test clearable (l.71-81) n'assert le bouton que présent, jamais masqué par disabled. E2e teste disa
- **[a11y]** aria-busy='true' posé sur l'input quand pending(), absent sinon.
  - source: `time-field.html:43 [attr.aria-busy]=pending()?'true':null ; base-input.ts:63 (pending)`
  - assert: host.pending=true: input().getAttribute('aria-busy')==='true' ; pending=false → attribut absent.
  - preuve: Aucune occurrence de 'aria-busy' ni de pending dans time-field.spec.ts ; le host ne l'expose pas (l.10-15). Absent aussi de temporal.spec.ts (e2e).
- **[correctness]** min/max sérialisés sur les attributs natifs min/max via serialize()+precision(), exercés pour PlainTime aux deux précisions (minute → '08:00', second → '08:00:30').
  - source: `base-temporal-field.ts:98-106 (serializedMin/serializedMax) + time-field.ts:35-38 (serialize avec precision) ; time-field.html:46-47 [attr.min]/[attr.max]`
  - assert: Câbler host.min/host.max (PlainTime '08:00:30'/'18:00:30'); en precision 'minute' attendre input.getAttribute('min')==='08:00' & max==='18:00' ; en 'second' '08:00:30'/'18:00:30'.
  - preuve: Le template host (time-field.spec.ts:8) ne lie que value/label/clearable/precision — aucun [min]/[max]. Aucun des 6 tests (lignes 36-81) n'appelle getAttribute('min'/'max'). serializedMin/Max ne sont
- **[correctness]** Parsing tolérant : une heure syntaxiquement invalide retombe sur null sans exception (branche catch de parse via Temporal.PlainTime.from).
  - source: `base-temporal-field.ts:57-65 (parse try/catch) via time-field.ts:31-33 (fromString=Temporal.PlainTime.from)`
  - assert: input().value='25:99'; dispatch 'input'; expect(host.value()).toBeNull() sans exception — exerce le catch sur le parser PlainTime.
  - preuve: Le test 'sets the value to null when emptied' (lignes 62-69) n'exerce que raw==='' (branche `if (raw==='') return null` ligne 58), pas le catch ligne 61. Le test de parse (lignes 55-60) n'envoie qu'un
- **[correctness]** Touche Échap efface un champ clearable, et n'efface pas si non clearable (onKeyDown branché sur (keydown)).
  - source: `base-input.ts:158-163 (onKeyDown Escape) ; time-field.html:51 (keydown)=onKeyDown`
  - assert: clearable=true+value posée: dispatch keydown Escape → value()===null & input().value===''. Et clearable=false: Escape → valeur inchangée.
  - preuve: Aucun `keydown`/`Escape`/`KeyboardEvent` dans time-field.spec.ts ; les seuls dispatch sont des Event('input') (lignes 57, 66). Les deux branches d'onKeyDown ne sont jamais exercées pour time-field.

## tab-scroller-pager (7)

- **[a11y]** Host data-orientation reflète la valeur 'vertical'.
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:38`
  - assert: En orientation verticale, expect(fixture.nativeElement.querySelector('kt-tab-scroller').getAttribute('data-orientation')).toBe('vertical').
  - preuve: tab-scroller-pager.spec.ts:93 n'assertе que toBe('horizontal'). Aucune occurrence de 'vertical' associée à data-orientation dans la spec, et l'e2e ne lit jamais l'attribut data-orientation (grep getAt
- **[a11y]** Le chevron de FIN devient disabled à l'extrémité fin (canScrollEnd()===false → [disabled]).
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:66`
  - assert: À scrollLeft=max (fin atteinte), expect(chevron('end').hasAttribute('disabled')).toBe(true) ET expect(chevron('start').hasAttribute('disabled')).toBe(false).
  - preuve: L'unitaire fige scrollLeft à 0 (spec:54,118) et n'assertе que start disabled / end enabled (spec:85-88). L'e2e 'Pagination' (e2e:43-48) ramène au début puis assertе startBtn disabled + endBtn ENABLED
- **[a11y]** Résolution RTL des icônes : en dir='rtl', startIcon()='chevron_right' et endIcon()='chevron_left' (dir figé via afterNextRender getComputedStyle direction==='rtl').
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:86,90,109-113`
  - assert: Monter avec dir='rtl' (ou stubber getComputedStyle().direction='rtl'), attendre afterNextRender, expect(chevron('start').getAttribute('data-icon')).toBe('chevron_right') et chevron('end')='chevron_left'.
  - preuve: Aucune occurrence de 'rtl' ni de stub de getComputedStyle dans tab-scroller-pager.spec.ts ; le signal dir reste 'ltr' (afterNextRender ne bascule qu'en présence de direction:'rtl', jamais provoqué). A
- **[a11y]** Priorité du nom accessible : l'input par-instance [previousLabel]/[nextLabel] prime sur KT_TABS_CONFIG.
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:102,107`
  - assert: Lier [previousLabel]='X' avec KT_TABS_CONFIG previousLabel:'Y', puis expect(chevron('start').getAttribute('aria-label')).toBe('X') (l'input l'emporte sur le provider).
  - preuve: Le PagerHost de test (spec:9-26) n'a pas de binding [previousLabel]/[nextLabel] sur kt-tab-scroller. Le bloc KT_TABS_CONFIG (spec:129-142) ne teste que config→aria-label, sans input concurrent. Les te
- **[correctness]** Icônes des chevrons en orientation VERTICALE : startIcon()='expand_less' et endIcon()='expand_more' (branche `if (orientation()==='vertical')` du computed).
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:84-91`
  - assert: Avec un ngTabList orienté vertical (aria-orientation='vertical'), attendre chevron('start').getAttribute('data-icon')==='expand_less' et chevron('end').getAttribute('data-icon')==='expand_more'.
  - preuve: Le seul test d'icônes est tab-scroller-pager.spec.ts:80-83 qui n'assertе que l'horizontal (chevron_left/chevron_right) ; le host de test (spec:12-21) n'a pas d'aria-orientation, donc isVertical()===fa
- **[correctness]** Le clic sur le chevron de DÉBUT produit un défilement observable vers le début depuis une position avancée (wiring 'start' + sens).
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:51`
  - assert: En e2e : positionner la liste à mi-course (scrollLeft>0), cliquer le chevron de début, expect.poll(scrollLeft) à décroître strictement (delta ≈ clientWidth\*0.8).
  - preuve: L'unitaire ne spy que le chevron de FIN (spec:96-100, scrollByPage('end')) — le START n'a aucune assertion. L'e2e (e2e/tabs.spec.ts:43-46) clique startBtn pour ramener à scrollLeft<=1 (retour-à-zéro),
- **[edge]** Retrait de data-overflowing quand la liste NE déborde PAS (overflowing()===false → attribut absent).
  - source: `projects/ktortu/aaa/tabs/tab-scroller-pager.ts:39`
  - assert: Avec clientWidth>=scrollWidth (pas de débordement), expect(querySelector('kt-tab-scroller').hasAttribute('data-overflowing')).toBe(false), et les deux chevrons disabled.
  - preuve: Les deux blocs de la spec forcent le débordement via Object.defineProperty clientWidth=300 / scrollWidth=800 (spec:52-53 et 116-117) ; seul le cas présent est asserté (spec:92, hasAttribute(...).toBe(

## card (6)

- **[a11y]** Branche aria-label du garde de nom accessible de KtCardLink : un lien étiré vide portant [attr.aria-label] ne doit PAS warn.
  - source: `card-structure.ts:107-110 (hasName = textContent || aria-label || aria-labelledby) ; :109 getAttribute('aria-label')`
  - assert: Monter <a ktCardLink href="/x" aria-label="Ouvrir"></a> (sans texte) dans une [ktCard] ; spy console.warn ; asserter expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCardLink]')).
  - preuve: Seules deux configurations exercent le garde : InteractiveLinkHost a le texte 'Ouvrir' (card.spec.ts:39 → branche textContent) et NamelessLinkHost a un <a> vide sans attribut (l. 46 → cas nul, warn at
- **[a11y]** Branche aria-labelledby du garde de nom accessible de KtCardLink : un lien étiré VIDE étiqueté par aria-labelledby ne doit PAS warn.
  - source: `card-structure.ts:110 (this.host.hasAttribute('aria-labelledby'))`
  - assert: Monter <h3 id="t">T</h3><a ktCardLink href="/x" aria-labelledby="t"></a> dans une [ktCard] ; spy console.warn ; asserter qu'aucun warning '[ktCardLink]' n'est émis.
  - preuve: Aucun host unitaire ne pose aria-labelledby (TestHost l. 15, InteractiveLinkHost l. 39, NamelessLinkHost l. 46 : aucun n'a l'attribut). L'e2e (card.spec.ts:29) vérifie aria-labelledby='card-demo-t1' p
- **[a11y]** Aucun vol de focus au montage : une [ktCard] interactive avec lien étiré ne doit pas auto-focuser son [ktCardLink] au rendu.
  - source: `card.ts / card-structure.ts — aucun appel focus() ; comportement implicite à protéger contre régression`
  - assert: Après fixture.detectChanges() d'une carte interactive avec lien, asserter document.activeElement !== le [ktCardLink] (ou === document.body) : aucun focus programmatique au rendu.
  - preuve: Aucun test unitaire n'inspecte document.activeElement (recherche dans card.spec.ts : absent). L'e2e (card.spec.ts:30-31) appelle explicitement link.focus() PUIS asserte toBeFocused(), ce qui prouve la
- **[correctness]** KtCardLink utilisé HORS d'une [ktCard] : inject(KtCard,{optional:true}) renvoie null ; les host bindings (aria-disabled/tabindex) et handleClick (garde card?.disabled()) doivent rester inertes sans planter.
  - source: `card-structure.ts:93 (inject(KtCard,{optional:true})) ; :81-83 host bindings ; :95-100 handleClick`
  - assert: Monter <a ktCardLink href="/x">Seul</a> SANS [ktCard] ancêtre ; asserter !link.hasAttribute('aria-disabled') && !link.hasAttribute('tabindex'), et qu'un click dispatché garde defaultPrevented === false (card?.disabled() ne plante pas et ne bloque pas).
  - preuve: Les trois seuls hôtes de test placent [ktCardLink] DANS un [ktCard] : TestHost (card.spec.ts:10-19, lien à l. 15), InteractiveLinkHost (l. 39) et NamelessLinkHost (l. 46) ouvrent tous par <article ktC
- **[correctness]** Branche host.matches('a, button') du garde a11y de KtCard : une carte interactive posée directement sur <a>/<button> (sans [ktCardLink]) ne doit PAS warn '[ktCard] interactive…'.
  - source: `card.ts:99 (const hasTarget = this.host.matches('a, button') || !!this.cardLink())`
  - assert: Monter <a ktCard interactive href="/x">…</a> (interactive sans [ktCardLink]) ; spy console.warn ; asserter expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('[ktCard] interactive')).
  - preuve: Le test 'should not warn' (card.spec.ts:166-174) monte InteractiveLinkHost = <article ktCard interactive><a ktCardLink…> (l. 39), donc exerce uniquement la branche cardLink(). Tous les hôtes posent [k
- **[edge]** Transform booleanAttribute des inputs interactive/disabled : présence d'attribut nu (<article ktCard interactive disabled>) doit résoudre data-interactive ET data-disabled.
  - source: `card.ts:87 (interactive input booleanAttribute) ; :90 (disabled input booleanAttribute)`
  - assert: Monter <article ktCard interactive disabled> (attributs nus, pas de binding) ; asserter card.hasAttribute('data-interactive')===true ET card.hasAttribute('data-disabled')===true.
  - preuve: Les assertions sur data-interactive/data-disabled (card.spec.ts:82-90, 97-105) sont pilotées exclusivement par signals booléens host.interactive.set()/host.disabled.set() via [interactive]/[disabled]

## date-field (6)

- **[a11y]** blur sur l'input pose touched=true, déclenchant showInvalid()/affichage d'erreur via le matcher par défaut (invalid && touched). Le cycle non-touché→blur→touché→erreur visible n'est exercé nulle part.
  - source: `date-field.html:51 (blur)="touched.set(true)" + base-input.ts:116-118 showInvalid / :123 matcher défaut`
  - assert: Avec invalid()=true et touched initial false : aucune erreur affichée ; dispatcher blur sur input() ; après detectChanges, expect(input().getAttribute('aria-invalid')).toBe('true') ET expect(el.textContent) contient le message d'erreur.
  - preuve: Le spec unit ne dispatch jamais 'blur' (aucune occurrence de 'blur' dans date-field.spec.ts) et le host DateFieldHost (lignes 16-22) n'expose même pas d'input invalid/errors. L'e2e 'États' (temporal.s
- **[a11y]** État pending() : l'input doit porter aria-busy='true' et la field-box data-pending (signalisation a11y d'une validation async en cours).
  - source: `date-field.html:43 [attr.aria-busy] et :20 [attr.data-pending]`
  - assert: pending=true ⇒ expect(input().getAttribute('aria-busy')).toBe('true') ET expect(el.querySelector('.kt-field-box').hasAttribute('data-pending')).toBe(true) ; pending=false ⇒ aria-busy absent (null).
  - preuve: Grep 'pending|aria-busy|data-pending' sur date-field.spec.ts : aucun résultat. Le host n'expose pas pending. L'e2e temporal.spec.ts ne pose aucun état pending (grep sans correspondance).
- **[correctness]** Le bouton effacer ne doit PAS apparaître quand le champ est disabled ou readonly, même avec clearable=true et valeur non vide (showClear = clearable && !disabled && !readonly && !isEmpty).
  - source: `base-input.ts:123-125 showClear`
  - assert: clearable=true + value=PlainDate + disabled=true ⇒ expect(clearButton()).toBeNull(); idem readonly=true ⇒ expect(clearButton()).toBeNull().
  - preuve: Les seuls tests du bouton clear (date-field.spec.ts:77-87 et 118-130) posent clearable=true sur un champ activé ; le host DateFieldHost (lignes 16-22) n'expose ni disabled ni readonly, rendant tout ca
- **[correctness]** Garde anti-écrasement de l'effet de synchro : input focalisé + value→null (sans clear) ne doit PAS réécrire input.value='' (préserve la saisie partielle). Branche (!isFocused || val !== null).
  - source: `base-temporal-field.ts:46 condition (!isFocused || val !== null)`
  - assert: value=PlainDate ; input().focus() ; input().value='2026-06' (sans event) ; host.value.set(null) ; detectChanges ; expect(input().value).toBe('2026-06') (saisie non écrasée).
  - preuve: Le spec unit teste reset() (date-field.spec.ts:99-107) et clear()/Escape (77-87, 118-130) mais jamais le scénario input focalisé + value.set(null) sans clear. La branche de préservation (isFocused &&
- **[edge]** L'attribut name natif est reflété quand name() est fourni, et absent (null) sinon ([attr.name]="name() || null").
  - source: `date-field.html:44 [attr.name]`
  - assert: Par défaut expect(input().hasAttribute('name')).toBe(false) ; après name='birthDate' expect(input().getAttribute('name')).toBe('birthDate').
  - preuve: Aucune occurrence de 'name' (attribut natif) dans date-field.spec.ts ; le host DateFieldHost (lignes 16-22) ne câble pas l'input name. L'e2e temporal.spec.ts ne teste pas l'attribut name (grep sans co
- **[edge]** Câblage du datalist sur kt-date-field : suggestions() non vide ⇒ input[type=date] reçoit [attr.list]=datalistId et un <datalist> avec une <option> par suggestion sérialisée ISO ; sans suggestions, list absent.
  - source: `date-field.html:48 [attr.list] / :54-60 datalist ; base-temporal-field.ts:116-119 hasSuggestions/datalistOptions`
  - assert: Sans suggestions : expect(input().hasAttribute('list')).toBe(false). Avec suggestions=[PlainDate.from('2026-01-01'),...] : listId non null ; expect(el.querySelectorAll(`datalist#${listId} option`).length).toBe(nbSuggestions) et 1re option value '2026-01-01'.
  - preuve: L'e2e datalist (temporal.spec.ts:48-54) cible input[type="month"] (year-month-field) exclusivement, jamais date-field. Le spec unit date-field n'a aucun test 'datalist'/'suggestions'/'list', et le hos

## chip (4)

- **[a11y]** Valeur par defaut removeLabel='Remove' : nom accessible du bouton quand le consommateur ne passe aucun removeLabel. La branche par defaut de la cascade n'est jamais exercee.
  - source: `chip.ts:50 (removeLabel = input<string>('Remove')) + chip.html:8 ([attr.aria-label]="removeLabel()")`
  - assert: Rendre <kt-chip removable> sans removeLabel et asserter querySelector('.kt-chip\_\_remove').getAttribute('aria-label')==='Remove'.
  - preuve: Le Host de chip.spec.ts:12 fixe TOUJOURS removeLabel="Remove Banana" en dur ; la seule assertion aria-label (chip.spec.ts:46) attend 'Remove Banana'. Aucun second composant hote sans removeLabel. En e
- **[a11y]** L'icone 'close' visible est aria-hidden=true : le nom accessible du bouton provient uniquement de aria-label. Une regression annoncerait 'Remove X close'.
  - source: `chip.html:11 (<span class="kt-chip__close-icon" aria-hidden="true">close</span>)`
  - assert: expect(querySelector('.kt-chip\_\_close-icon').getAttribute('aria-hidden')).toBe('true') ; en e2e, getByRole('button',{name:/^Retirer X$/}) en correspondance EXACTE.
  - preuve: Aucune occurrence d'aria-hidden ni de 'close-icon' dans chip.spec.ts. En e2e, les getByRole (ex. chips.spec.ts:35 {name:'Retirer Angular'}) utilisent un match sous-chaine/normalise non exact : si aria
- **[correctness]** Clic sur le bouton retirer d'un chip disabled : aucune emission de l'output remove. Le test disabled ne verifie que l'attribut DOM disabled, jamais que le clic est neutralise.
  - source: `chip.html:7 ([disabled]="disabled()") + chip.html:9 ((click)="remove.emit()") + chip.ts:52 (remove output)`
  - assert: Avec removable+disabled actifs, btn.click() puis expect(host.removed()).toBe(0).
  - preuve: chip.spec.ts:51-58 (test disabled) n'appelle jamais btn.click() et termine sur expect(btn.disabled).toBe(true) ; le seul btn.click() du fichier est chip.spec.ts:47 dans le test removable SANS disabled
- **[edge]** Host binding view-transition-name : un chip hors liste (sans ChipTransitionScope injecte) resout view-transition-name a null. La branche scope absent -> null n'est jamais verifiee.
  - source: `chip.ts:35 ('[style.view-transition-name]':'scope?.transitioning() ? viewTransitionName : null')`
  - assert: Sur un kt-chip nu (sans provider ChipTransitionScope), expect((chipEl as HTMLElement).style.getPropertyValue('view-transition-name')).toBe('').
  - preuve: Aucune occurrence de 'view-transition-name' ni de style.getPropertyValue dans chip.spec.ts ni dans chips.spec.ts. Les chips nus de chip.spec.ts sont rendus sans scope (aucun provider ChipTransitionSco

## tab-scroll (4)

- **[a11y]** L'attribut hôte data-kt-tab-scroller (hérité de la host directive KtTabScroller) doit apparaître sur l'élément [ngTabList] portant ktTabScroll — marqueur CSS qui masque la scrollbar native, non asserté pour le chemin alias ni en unitaire ni en e2e.
  - source: `tab-scroll.ts:17 (hostDirectives: [KtTabScroller]) -> tab-scroller.ts:62 ('[attr.data-kt-tab-scroller]')`
  - assert: const list = fixture.nativeElement.querySelector('[ngTabList]'); expect(list.hasAttribute('data-kt-tab-scroller')).toBe(true);
  - preuve: tab-scroll.spec.ts ne contient qu'un seul it() (l.66-72) dont la seule assertion est expect(scrollSpy).toHaveBeenCalledWith(...) (l.71) ; 'data-kt-tab-scroller', 'hasAttribute' et 'getAttribute' sont
- **[correctness]** La référence exportAs:'ktTabScroll' doit résoudre une instance exposant la surface de pagination réactive (canScrollStart/canScrollEnd/overflowing/orientation/scrollByPage) ré-exposée via l'alias.
  - source: `tab-scroll.ts:16 (exportAs:'ktTabScroll') + héritage tab-scroller.ts:81-89 (computed canScrollStart/canScrollEnd/overflowing/orientation)`
  - assert: Template host <ul ngTabList ktTabScroll #s="ktTabScroll"> ; via debugElement.query(By.directive(KtTabScroller)).references['s'], asserter typeof s.scrollByPage === 'function' et s.overflowing() === true (contenu débordant).
  - preuve: Le template host (tab-scroll.spec.ts:14) déclare <ul ngTabList ktTabScroll [(selectedTab)]="selected"> SANS variable de référence de template ; les chaînes 'ktTabScroll' (en exportAs/ref), 'By.directi
- **[correctness]** scrollByPage invoqué via la ref ktTabScroll doit réellement déclencher scrollBy sur la liste (chemin alias de la pagination).
  - source: `tab-scroll.ts:16-17 (alias) -> tab-scroller.ts:142-152 (scrollByPage -> el.scrollBy)`
  - assert: Installer scrollBySpy (HTMLElement.prototype.scrollBy), récupérer la directive via exportAs:'ktTabScroll', appeler s.scrollByPage('end'), asserter expect(scrollBySpy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' }). (clientWidth mocké 300 x PAGE_RATIO 0.8 = 240.)
  - preuve: tab-scroll.spec.ts n'espionne que scrollTo (scrollSpy, l.33-34) ; 'scrollBy' n'apparait nulle part dans le fichier, et scrollByPage n'est jamais appelé. e2e/tabs.spec.ts:31-53 exerce la pagination uni
- **[edge]** Le scroll-into-view via l'alias doit se déclencher aussi lors d'un changement de sélection programmatique post-montage, pas seulement au montage initial.
  - source: `tab-scroll.ts:17 -> tab-scroller.ts:94-101 (afterRenderEffect earlyRead computeScrollTarget / write scrollTo)`
  - assert: Monter avec selected='a' (onglet non débordant => pas de scroll), scrollSpy.mockClear(), puis selected.set('d') + detectChanges + whenStable, et asserter expect(scrollSpy).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' }).
  - preuve: L'unique test (tab-scroll.spec.ts:66-72) monte avec selected figé à 'd' (host l.24, selected = signal('d')) et ne réalise jamais de selected.set(...) après montage ; il n'y a aucun mockClear ni mutati

## instant-field (4)

- **[a11y]** L'état pending doit poser aria-busy='true' sur l'input ET data-pending='' sur le .kt-field-box. Câblé dans le template instant mais asserté dans aucun spec temporel ni en e2e.
  - source: `instant-field.html:43 ([attr.aria-busy]) + instant-field.html:20 ([attr.data-pending]) via pending()`
  - assert: Exposer [pending] sur l'hôte, host.pending.set(true), détecter, puis expect(input().getAttribute('aria-busy')).toBe('true') et expect(el.querySelector('.kt-field-box')?.getAttribute('data-pending')).toBe('') ; vérifier aussi l'état initial null (aria-busy absent).
  - preuve: Aucune occurrence de 'pending', 'aria-busy' ni 'data-pending' dans instant-field.spec.ts (103 lignes, hôte lignes 9-14 sans [pending]) ni dans e2e/temporal.spec.ts (68 lignes).
- **[correctness]** Les bornes min/max de l'instant transitent par serialize() qui convertit l'Instant UTC en heure locale (toZonedDateTimeISO(timeZoneId).toPlainDateTime), posées en attributs natifs [attr.min]/[attr.max]. Aucun test instant ne pose [min]/[max], donc la conversion UTC->local de serializedMin/serializedMax propre à l'instant n'est jamais exercée.
  - source: `instant-field.ts:48-53 (serialize) + base-temporal-field.ts:98-106 (serializedMin/Max) + instant-field.html:46-47 ([attr.min]/[attr.max])`
  - assert: Exposer [min]/[max] sur l'hôte, host.min.set(Temporal.Instant.from('2026-06-08T08:00:00Z')); fixture.detectChanges(); expect(input().getAttribute('min')).toBe('2026-06-08T10:00') (et un cas max), prouvant la borne native en heure locale Paris et non en UTC brut.
  - preuve: Le template hôte de instant-field.spec.ts lignes 9-14 ne lie que [(value)], [label], [clearable], [precision] ; aucune occurrence de 'min' ni 'max' dans tout le spec (103 lignes). Le seul test de born
- **[correctness]** Les suggestions instant sont rendues dans un <datalist> dont chaque <option value> est produite par serialize() — donc convertie UTC->heure locale. Le câblage (input[list], options sérialisées en local) n'est testé ni en unitaire instant ni en e2e.
  - source: `base-temporal-field.ts:111-119 (suggestions/datalistOptions/hasSuggestions) + instant-field.html:49,55-61 ([attr.list], <option [value]>)`
  - assert: Exposer [suggestions]=[Temporal.Instant.from('2026-06-08T08:00:00Z')], détecter, puis expect(input().getAttribute('list')) non nul et expect(el.querySelector(`datalist#${listId} option`)?.getAttribute('value')).toBe('2026-06-08T10:00') (heure locale Paris, pas l'UTC).
  - preuve: instant-field.spec.ts ne contient ni 'suggestions', ni 'datalist', ni 'list' (hôte lignes 9-14 sans [suggestions]). L'unique test datalist e2e (temporal.spec.ts:48-54) cible input[type="month"] (year-
- **[edge]** Le bouton « effacer » ne doit PAS être rendu quand le champ est vide, désactivé ou en lecture seule (showClear = clearable && !disabled && !readonly && !isEmpty). Les specs temporels n'assertent que la présence positive ; la branche négative (bouton absent) n'est jamais vérifiée.
  - source: `base-input.ts (showClear) + instant-field.html:63-67 (@if (showClear()))`
  - assert: host.clearable.set(true) avec value=null : expect(el.querySelector('.kt-field-box**clear')).toBeNull() ; puis avec une valeur mais disabled=true : expect(el.querySelector('.kt-field-box**clear')).toBeNull().
  - preuve: instant-field.spec.ts:92-102 (seul test de la croix) fait clearable.set(true) AVEC value renseignée et n'asserte que expect(clearBtn).toBeTruthy() ; aucune assertion .toBeNull() / branche négative (cl
