import {app} from 'hyperapp';
import {textarea, div, h2, form, button, p} from '@hyperapp/html';
import {preventDefault, targetValue} from '@hyperapp/events';
import {Http} from 'hyperapp-fx';

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

const REST = {
  init(state, {resources, endpoint}) {
    window.HYPERAPP_REST = {
      resources,
      endpoint,
    };

    const _rest = {};
    Object.entries(resources).forEach(([resource, actions]) => {
      if (includes('create', actions)) {
        _rest[resource] = {_new: {}};
      }
    });
    return set('_rest', _rest, state);
  },
};

REST.fx = {};
REST.actions = {};

REST.fx.index = resourceName => {
  console.log('REST.fx.index', {resourceName});
  return [
    [],
    Http({
      url: `${HYPERAPP_REST.endpoint}/${pluralize(resourceName)}`,
      options: {
        headers: {'Content-Type': 'application/json'},
      },
      action: REST.actions.UpdateCollection(pluralize(resourceName)),
    }),
  ];
};

REST.collection = REST.fx.index;

REST.setNewProp = curry((resourceName, prop, state, value) => ({
  ...state,
  _rest: {
    ...state._rest,
    [pluralize(resourceName)]: {
      ...state[pluralize(resourceName)],
      _new: {
        ...state[pluralize(resourceName)]['_new'],
        [prop]: value,
      },
    },
  },
}));

REST.actions.UpdateCollection = curry((resourceName, state, resources) =>
  set(resourceName, resources, state),
);

// const SERVER_URL = 'https://intense-plateau-18988.herokuapp.com';

// Events
REST.fx.create = (state, [resourceName, resource]) => {
  console.log('REST.fx.create', {state, resourceName, resource});
  return [
    state,
    // Optimistic state update causing problems when we get the real thing from the server
    // AddResourceToState(state, [
    //   resourceName,
    //   {...resource, id: nextId(state, resourceName)},
    // ]),
    Http({
      url: `${HYPERAPP_REST.endpoint}/${pluralize(resourceName)}`,
      options: {
        method: 'POST',
        body: `{ "${resourceName}": ${JSON.stringify(resource)} }`,
        headers: {'Content-Type': 'application/json'},
      },
      action(state, response) {
        return REST.AddResourceToState(state, [resourceName, response]);
      },
      error(state, err) {
        return RemoveResourceFromState(state, [
          resourceName,
          lastId(state, resourceName),
        ]);
      },
    }),
  ];
};

const nextId = (state, resourceName) =>
  Object.keys(state[pluralize(resourceName)]).length + 1;
const lastId = (state, resourceName) =>
  Object.keys(state[pluralize(resourceName)]).length;

// Actions

const setNoteContent = (state, content) => ({
  ...state,
  newNote: {content},
});

REST.newProp = (resource, prop, state) =>
  state['_rest'][pluralize(resource)]['_new'][prop];

REST.AddResourceToState = (state, [resourceName, resource]) =>
  set(
    `new${capitalize(resourceName)}`,
    {},
    set(
      pluralize(resourceName),
      append(resource, state[pluralize(resourceName)]),
      state,
    ),
  );

const RemoveResourceFromState = (state, [resourceName, resourceId]) => ({
  ...state,
  [pluralize(resourceName)]: omit(
    resourceId.toString(),
    state[pluralize(resourceName)],
  ),
});

REST.actions.create = (state, resourceName) => [
  REST.fx.create,
  [resourceName, state._rest[pluralize(resourceName)]._new],
];

// VIEWS
const Note = note => div({class: 'note'}, [h2(note.id), p(note.content)]);

const resources = ['note'];

const initialState = [
  REST.init(
    {title: 'My notes'},
    {
      resources: {notes: ['collection', 'create']},
      endpoint: 'http://localhost:3000',
    },
  ),
  REST.collection('notes'),
];

app({
  init: initialState,
  view: state => {
    console.log({state});
    return div({}, [
      form({onsubmit: preventDefault([REST.actions.create, 'note'])}, [
        textarea({
          oninput: [REST.setNewProp('note', 'content'), targetValue],
          value: REST.newProp('note', 'content', state),
        }),
        button('Create Note'),
      ]),
      state.notes && state.notes.map(Note),
    ]);
  },
  node: document.getElementById('app'),
});
