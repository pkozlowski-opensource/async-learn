type ResolvedCallback = (value: any) => void;
type RejectedCallback = (reason: any) => void;
type PromiseResolver = (res: ResolvedCallback, rej: RejectedCallback) => void;

interface Thenable {
  then(onResolve?: ResolvedCallback, onReject?: RejectedCallback): Thenable;
}

function isThenable(maybeThenable: any): maybeThenable is Thenable {
  return maybeThenable != null && typeof maybeThenable.then === 'function';
}

function isFunction(maybeFn: any): maybeFn is(...args: any) => void {
  return typeof maybeFn === 'function';
}

const enum XPromiseState {
  PENDING,
  RESOLVED,
  REJECTED
}

export class XPromise implements Thenable {
  private _state = XPromiseState.PENDING;
  private _resolvedValue: any;
  private _rejectedReason: any;
  private _thenableQueue: [XPromise, ResolvedCallback?, RejectedCallback?][] =
      [];

  // TODO: type for asyncFn
  constructor(promiseResolver?: PromiseResolver) {
    if (isFunction(promiseResolver)) {
      setTimeout(() => {
        promiseResolver(this._resolve.bind(this), this._reject.bind(this));
      });
    } else {
      throw new Error(`Promise resolver ${promiseResolver} is not a function`);
    }
  }

  private _propagateResolve() {
    for (const [settled, onResolve] of this._thenableQueue) {
      try {
        if (isFunction(onResolve)) {
          const transformedValue = onResolve(this._resolvedValue);
          settled._resolve(transformedValue);
        } else {
          settled._resolve(this._resolvedValue);
        }
      } catch (e) {
        settled._reject(e);
      }
    }

    // processed all the then handlers registered so far - reset the queue;
    this._thenableQueue = [];
  }

  private _propagateReject() {
    for (const [settled, _, onReject] of this._thenableQueue) {
      if (isFunction(onReject)) {
        const transformedValue = onReject(this._rejectedReason);
        settled._resolve(transformedValue);
      } else {
        settled._reject(this._rejectedReason);
      }
    }

    // processed all the then handlers registered so far - reset the queue;
    this._thenableQueue = [];
  }

  private _resolve(value: any) {
    // TODO: assert that it is in the pending state
    if (this._state === XPromiseState.PENDING) {
      this._state = XPromiseState.RESOLVED;
      this._resolvedValue = value;
      this._propagateResolve();
    }
  }

  private _reject(reason: any) {
    // TODO: assert that it is in the pending state
    if (this._state === XPromiseState.PENDING) {
      this._state = XPromiseState.REJECTED;
      this._rejectedReason = reason;
      this._propagateReject();
    }
  }

  then(onResolve?: ResolvedCallback, onReject?: RejectedCallback): Thenable {
    const settled = new XPromise(() => {});

    this._thenableQueue.push([settled, onResolve, onReject]);

    if (this._state === XPromiseState.RESOLVED) {
      this._propagateResolve();
    } else if (this._state === XPromiseState.REJECTED) {
      this._propagateReject();
    }

    return settled;
  }

  static resolve(value?: any) {
    return new XPromise(resolve => {
      resolve(value);
    });
  }

  static reject(reason?: any) {
    return new XPromise((_, reject) => {
      reject(reason);
    });
  }
}

// TODO:
// - fix failing promise/A+ tests
// - abstract scheduler away (today got setTimeout in multiple places)
// - Promise.all
// - Promise.catch


// INSIGHTS:
// - .then is _mapping_ (transforming) promised value
