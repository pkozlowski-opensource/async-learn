import {XPromise} from './index';

describe('XPromise', () => {
  describe('constructor', () => {
    it('should error if provided with a non-function', () => {
      expect(() => {
        new XPromise(undefined);
      }).toThrowError('Promise resolver undefined is not a function');

      expect(() => {
        new XPromise({} as any);
      }).toThrowError('Promise resolver [object Object] is not a function');
    });
  });

  describe('Promise.resolve', () => {
    it('should create a resolved promise with a value', async () => {
      const v = await XPromise.resolve(5);
      expect(v).toBe(5);
    });

    it('should create a resolved promise with no arguments', async () => {
      const v = await XPromise.resolve();
      expect(v).toBeUndefined();
    });

    it('should create a resolved promise with .then', async () => {
      const v = await XPromise.resolve(1).then(v => v + 1);
      expect(v).toBe(2);
    });
  });

  describe('Promise.reject', () => {
    it('should create a promise rejected with some reason', async () => {
      try {
        await XPromise.reject(new Error('err'));
        fail('awaiting rejected promise should throw');
      } catch (e) {
        expect(e.message).toBe('err');
      }
    });

    it('should create a rejected promise with no arguments', async () => {
      try {
        await XPromise.reject();
        fail('awaiting rejected promise should throw');
      } catch (e) {
        expect(e).toBeUndefined();
      }
    });

    it('should create a resolved promise with .then', async () => {
      const v = await XPromise.reject(1).then(() => {}, v => v + 1);
      expect(v).toBe(2);
    });
  });

  describe('.then onFulfilled', () => {
    it('should transform value', async () => {
      const v = await XPromise.resolve(1).then(v => v + 1);
      expect(v).toBe(2);
    });

    it('should reject if onFulfilled throws', async () => {
      const v = await XPromise.resolve(1)
                    .then(v => {
                      throw new Error('err in onFulfilled');
                    })
                    .then(undefined, (err) => {
                      return 'catch';
                    });

      expect(v).toBe('catch');
    });

    it('should allow resolving with another promise', async () => {
      const v = await XPromise.resolve(1).then(v => XPromise.resolve('async'));
      expect(v).toBe('async');
    });
  });

  describe('.then spec', () => {
    it('2.2.1.1: If onFulfilled is not a function, it must be ignored.',
       async () => {
         const value = await XPromise.resolve(1).then();
         expect(value).toBe(1);
       });

    it('2.2.1.2: If onRejected is not a function, it must be ignored.',
       async () => {
         try {
           await XPromise.reject(new Error('err')).then();
           fail('awaiting rejected promise should throw');
         } catch (e) {
           expect(e.message).toBe('err');
         }
       });

    it('2.2.2.2: fulfilled after a delay', async () => {
      const p = new XPromise((resolve) => {
                  setTimeout(() => resolve('after'), 50);
                }).then((v: any) => v);

      const v = await p;
      expect(v).toBe('after');
    });
  });
});
