import {app} from 'hyperapp';
import {textarea, div, h2, form, button, p} from '@hyperapp/html';
import {preventDefault, targetValue} from '@hyperapp/events';
import {Http} from 'hyperapp-fx';

// UTILITIES
const pluralize = word => word.concat('s');
const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);

//    omit :: (k, {k: v}) -> {k: v}
const omit = (k, obj) =>
  Object.fromEntries(Object.entries(obj).filter(([key, _]) => key !== k));

// Events
const Create = (state, [resourceName, resource]) => [
  state,
  // Optimistic state update causing problems when we get the real thing from the server
  // AddResourceToState(state, [
  //   resourceName,
  //   {...resource, id: nextId(state, resourceName)},
  // ]),
  Http({
    url: `http://localhost:3000/${pluralize(resourceName)}`,
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

const Note = ([id, note]) => div({class: 'note'}, [h2(id), p(note.content)]);

app({
  init: {
    newNote: {},
    notes: {
      1: {content: 'Happy New Year!', created_at: new Date(2019, 1, 1)},
      2: {content: 'Merry Christmas', created_at: new Date(2019, 12, 25)},
    },
  },
  view: state => {
    console.log({state});
    return div({}, [
      form({onsubmit: preventDefault(CreateNote)}, [
        textarea({
          oninput: [setNoteContent, targetValue],
          value: state.newNote.content,
        }),
        button('Create Note'),
      ]),
      Object.entries(state.notes).map(Note),
    ]);
  },
  node: document.getElementById('app'),
});
