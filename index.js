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

const REST = {
  init(state, {resources, endpoint}) {
    window.HYPERAPP_REST = {
      resources,
      endpoint,
    };
    return state;
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

REST.actions.UpdateCollection = curry((resourceName, state, resources) =>
  set(resourceName, resources, state),
);

// const SERVER_URL = 'https://intense-plateau-18988.herokuapp.com';

// Events
const Create = (state, [resourceName, resource]) => [
  state,
  // Optimistic state update causing problems when we get the real thing from the server
  // AddResourceToState(state, [
  //   resourceName,
  //   {...resource, id: nextId(state, resourceName)},
  // ]),
  Http({
    url: `${SERVER_URL}/${pluralize(resourceName)}`,
    options: {
      method: 'POST',
      body: `{ "${resourceName}": ${JSON.stringify(resource)} }`,
      headers: {'Content-Type': 'application/json'},
    },
    action(state, response) {
      return AddResourceToState(state, [resourceName, response]);
    },
    error(state, err) {
      return RemoveResourceFromState(state, [
        resourceName,
        lastId(state, resourceName),
      ]);
    },
  }),
];

const nextId = (state, resourceName) =>
  Object.keys(state[pluralize(resourceName)]).length + 1;
const lastId = (state, resourceName) =>
  Object.keys(state[pluralize(resourceName)]).length;

// Actions

const setNoteContent = (state, content) => ({
  ...state,
  newNote: {content},
});

const AddResourceToState = (state, [resourceName, resource]) => ({
  ...state,
  [pluralize(resourceName)]: {
    ...state[pluralize(resourceName)],
    [resource.id]: resource,
  },
  [`new${capitalize(resourceName)}`]: {},
});

const RemoveResourceFromState = (state, [resourceName, resourceId]) => ({
  ...state,
  [pluralize(resourceName)]: omit(
    resourceId.toString(),
    state[pluralize(resourceName)],
  ),
});

const CreateNote = state => [Create, ['note', state.newNote]];

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
      form({onsubmit: preventDefault(CreateNote)}, [
        textarea({
          oninput: [setNoteContent, targetValue],
          // value: state.newNote.content,
        }),
        button('Create Note'),
      ]),
      state.notes && state.notes.map(Note),
    ]);
  },
  node: document.getElementById('app'),
});
