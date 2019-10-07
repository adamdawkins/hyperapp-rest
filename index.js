import {app} from 'hyperapp';
import {textarea, div, h1, h2, form, button, p} from '@hyperapp/html';
import {preventDefault, targetValue} from '@hyperapp/events';
import REST from './hyperapp-rest';

// VIEWS
const Note = note => div({class: 'note'}, [h2(note.id), p(note.content)]);

app({
  init: [
    REST.init(
      {title: 'My notes'},
      {
        resources: {notes: ['collection', 'create']},
        endpoint: 'http://localhost:3000',
      },
    ),
    REST.collection('notes'),
  ],
  view: state => {
    console.log({state});
    return div({}, [
      h1(state.title),
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
