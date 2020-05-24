import {XPromise} from './index';

const adapter = {
  deferred() {
    const p = new XPromise(() => {});
    return {
      promise: p,
      resolve: (p as any)._resolve.bind(p),
      reject: (p as any)._reject.bind(p),
    };
  }
};

const suite = require('promises-aplus-tests');
suite(adapter, function(err: any) {
  throw (err);
});
