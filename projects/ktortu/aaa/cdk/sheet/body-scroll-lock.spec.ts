import { TestBed } from '@angular/core/testing';
import { KtBodyScrollLock } from './body-scroll-lock';

describe('KtBodyScrollLock', () => {
  let lock: KtBodyScrollLock;

  beforeEach(() => {
    document.body.style.overflow = '';
    lock = TestBed.inject(KtBodyScrollLock);
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('verrouille au premier lock et restaure au dernier unlock', () => {
    lock.lock();
    expect(document.body.style.overflow).toBe('hidden');
    lock.unlock();
    expect(document.body.style.overflow).toBe('');
  });

  it('compteur de références : reste verrouillé tant qu’un consommateur subsiste', () => {
    lock.lock();
    lock.lock();
    lock.unlock();
    expect(document.body.style.overflow).toBe('hidden'); // 2 verrous, 1 relâché
    lock.unlock();
    expect(document.body.style.overflow).toBe(''); // dernier relâché
  });

  it('restaure la valeur d’overflow d’origine (pas forcément vide)', () => {
    document.body.style.overflow = 'scroll';
    lock.lock();
    expect(document.body.style.overflow).toBe('hidden');
    lock.unlock();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('unlock sans lock préalable est inerte (pas de sous-comptage)', () => {
    lock.unlock();
    expect(document.body.style.overflow).toBe('');
    lock.lock(); // un lock ultérieur fonctionne toujours
    expect(document.body.style.overflow).toBe('hidden');
  });
});
