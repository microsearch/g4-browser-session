import {
  G4AuthAuthMessage,
  G4CollectionLoadedMessage,
  G4CollectionLoadingMessage,
  G4DocumentLoadedMessage,
  G4SessionCloseMessage,
  G4SessionCreateMessage,
  G4SessionFailMessage,
  G4TenantArchiveMessage,
  G4TenantCreateMessage,
  G4UserArchiveMessage,
  G4UserCreateMessage,
  G4UserImportMessage,
  G4UserUpdateMessage,
} from "g4api-ts";

export { subscribe, G4NotificationOptions, G4Subscriptions };

type G4NotificationOptions = {
  endpoint: string;
  tenant: string;
  bearer: () => string;
  onerror?: (event: Event) => void;
  subs: G4Subscriptions;
};

type G4Subscriptions = {
  auth?: {
    auth?: (message: G4AuthAuthMessage) => void;
  };
  session?: {
    create?: (message: G4SessionCreateMessage) => void;
    close?: (message: G4SessionCloseMessage) => void;
    fail?: (message: G4SessionFailMessage) => void;
  };
  user?: {
    create?: (message: G4UserCreateMessage) => void;
    import?: (message: G4UserImportMessage) => void;
    update?: (message: G4UserUpdateMessage) => void;
    archive?: (message: G4UserArchiveMessage) => void;
  };
  document?: {
    loaded?: (message: G4DocumentLoadedMessage) => void;
  };
  collection?: {
    loading?: (message: G4CollectionLoadingMessage) => void;
    loaded?: (message: G4CollectionLoadedMessage) => void;
  };
  tenant?: {
    create?: (message: G4TenantCreateMessage) => void;
    archive?: (message: G4TenantArchiveMessage) => void;
  };
};

function subscribe(options: G4NotificationOptions) {
  if (options.endpoint.match(/^[a-z]+$/))
    options.endpoint = `wss://g4n-${options.endpoint}.v1.mrcapi.net`;

  const onmessage = (messageEvent: MessageEvent<string>) => {
    const message = JSON.parse(messageEvent.data) as {
      Subject: string;
      Message: string;
    };
    const matches = [
      ...message.Subject.matchAll(/^([A-Z]+|<G4ADMIN>):([a-z]+)\.([a-z]+)$/g),
    ];
    if (matches.length !== 0) {
      const [, , className, event] = matches[0];
      dispatchEvent(options.subs, className, event, message.Message);
    }
  };

  let socket = new WebSocket(options.endpoint);

  const onopen = () => {
    socket.send(
      JSON.stringify({
        action: "subscribe",
        tenant: options.tenant,
        events: events(options.subs),
        bearer: options.bearer(),
      })
    );
  };

  let reopen = true;
  const onclose = () => {
    if (reopen) {
      socket = new WebSocket(options.endpoint);
      socket.onmessage = onmessage;
      socket.onopen = onopen;
      socket.onclose = onclose;
      if (options.onerror) socket.onerror = options.onerror;
    }
  };

  socket.onmessage = onmessage;
  socket.onopen = onopen;
  socket.onclose = onclose;
  if (options.onerror) socket.onerror = options.onerror;

  return () => {
    reopen = false;
    socket.close();
  };
}

function events(subs: G4Subscriptions) {
  let events: string[] = [];
  for (const [_class, _events] of Object.entries(subs)) {
    for (const [_event] of Object.entries(_events)) {
      events.push(`${_class}.${_event}`);
    }
  }
  return events;
}

function dispatchEvent(
  subs: G4Subscriptions,
  className: string,
  event: string,
  message: string
) {
  switch (className) {
    case "auth":
      return dispatch_auth(subs, event, message);
    case "session":
      return dispatch_session(subs, event, message);
    case "user":
      return dispatch_user(subs, event, message);
    case "document":
      return dispatch_document(subs, event, message);
    case "collection":
      return dispatch_collection(subs, event, message);
    case "tenant":
      return dispatch_tenant(subs, event, message);
  }
}

function dispatch<T>(message: string, dispatcher?: (message: T) => void) {
  console.log(
    `dispatching: ${message} dispatcher: ${dispatcher ? "yes" : "no"}`
  );
  if (dispatcher) dispatcher(JSON.parse(message) as T);
}

function dispatch_auth(subs: G4Subscriptions, event: string, message: string) {
  switch (event) {
    case "auth":
      return dispatch<G4AuthAuthMessage>(message, subs.auth?.auth);
  }
}

function dispatch_session(
  subs: G4Subscriptions,
  event: string,
  message: string
) {
  switch (event) {
    case "create":
      return dispatch<G4SessionCreateMessage>(message, subs.session?.create);
    case "close":
      return dispatch<G4SessionCloseMessage>(message, subs.session?.close);
    case "fail":
      return dispatch<G4SessionFailMessage>(message, subs.session?.fail);
  }
}

function dispatch_user(subs: G4Subscriptions, event: string, message: string) {
  switch (event) {
    case "create":
      return dispatch<G4UserCreateMessage>(message, subs.user?.create);
    case "import":
      return dispatch<G4UserImportMessage>(message, subs.user?.import);
    case "update":
      return dispatch<G4UserUpdateMessage>(message, subs.user?.update);
    case "archive":
      return dispatch<G4UserArchiveMessage>(message, subs.user?.archive);
  }
}

function dispatch_document(
  subs: G4Subscriptions,
  event: string,
  message: string
) {
  switch (event) {
    case "loaded":
      return dispatch<G4DocumentLoadedMessage>(message, subs.document?.loaded);
  }
}

function dispatch_collection(
  subs: G4Subscriptions,
  event: string,
  message: string
) {
  switch (event) {
    case "loading":
      return dispatch<G4CollectionLoadingMessage>(
        message,
        subs.collection?.loading
      );
    case "loaded":
      return dispatch<G4CollectionLoadedMessage>(
        message,
        subs.collection?.loaded
      );
  }
}

function dispatch_tenant(
  subs: G4Subscriptions,
  event: string,
  message: string
) {
  switch (event) {
    case "create":
      return dispatch<G4TenantCreateMessage>(message, subs.tenant?.create);
    case "archive":
      return dispatch<G4TenantArchiveMessage>(message, subs.tenant?.archive);
  }
}
