import {Http} from 'hyperapp-fx';
import {append, capitalize, curry, set, includes, pluralize} from './utilities';

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
        console.error('REST.fx.create', err);
        return state;
        // return RemoveResourceFromState(state, [
        //   resourceName,
        //   lastId(state, resourceName),
        // ]);
      },
    }),
  ];
};

REST.actions.create = (state, resourceName) => [
  REST.fx.create,
  [resourceName, state._rest[pluralize(resourceName)]._new],
];

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

export default REST;
