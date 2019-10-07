// UTILITIES

const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);

// Currying from https://gist.github.com/branneman/4ffb7ec3fc4a2091849ba5d56742960c
const curryN = (fn, arity, accIn = []) => (...args) => {
  const len = args.length;
  const accOut = accIn.concat(args);
  if (len + accIn.length >= arity) {
    return fn.apply(this, accOut);
  }
  return curryN(fn, arity, accOut);
};

const curry = fn => curryN(fn, fn.length);

//    omit :: (k, {k: v}) -> {k: v}
const omit = (k, obj) =>
  Object.fromEntries(Object.entries(obj).filter(([key, _]) => key !== k));

const pluralize = word => (word.endsWith('s') ? word : word.concat('s'));

const set = curry((prop, value, source) => {
  var result = {},
    i;
  for (i in source) result[i] = source[i];
  result[prop] = value;

  return result;
});

const append = (x, xs) => xs.concat([x]);

const includes = (x, xs) => xs.indexOf(x) > -1;

export {curry, set, append, omit, includes, capitalize, pluralize};
