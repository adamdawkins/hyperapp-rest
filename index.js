import {app} from 'hyperapp';
import {textarea, div, h2, form, button, p} from '@hyperapp/html';
import {preventDefault, targetValue} from '@hyperapp/events';
// UTILITIES
const pluralize = word => word.concat('s');
const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);


// Helpers
const nextNoteId = state => Object.keys(state.notes).length + 1;

// Actions

const setNoteContent = (state, content) => ({
  ...state,
  newNote: {content},
});

const CreateNote = state => ({
  ...state,
  notes: {
    ...state.notes,
    [nextNoteId(state)]: {...state.newNote, createdAt: new Date()},
  },
  newNote: {},
});

// VIEWS

const Note = ([ id, note ]) => div({class: 'note'}, [h2(id), p(note.content)]);

app({
  init: {
    newNote: {},
    notes: {
      1: {content: 'Happy New Year!', createdAt: new Date(2019, 1, 1)},
      2: {content: 'Merry Christmas', createdAt: new Date(2019, 12, 25)},
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
