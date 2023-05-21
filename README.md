# jest-teardown

_test hooks done right._

`teardown` is a hook that runs at the end of the current scope:

- When called in a `beforeEach`, it'll run as `afterEach`
- When called in a `beforeAll`, it'll run as `afterAll`
- When called in a test, it'll run at the end of the test

This allows to put setup & teardown together in reusable utility functions, which can then be used wherever needed.

# Usage
Using the example from [the Jest documentation](https://jestjs.io/docs/setup-teardown): we have an `initializeCityDatabase` setup method and a `clearCityDatabase` teardown method:

## Idiomatic usage

```javascript
// test-utils/city-database.js
import { teardown } from 'jest-teardown';

export function useCityDatabase() {
  initializeCityDatabase();
  teardown(() => clearCityDatabase());
}

// my-test.spec.js
import { useCityDatabase } from './test-utils/city-database';

// setup runs in `beforeEach`, teardown in `afterEach`
beforeEach(() => useCityDatabase());
// setup runs in `beforeAll`, teardown in `afterAll`
beforeAll(() => useCityDatabase());
// setup runs at start of test, teardown at the end of the test
test('my test', () => {
  useCityDatabase();
  /* rest of the test */
});
```


## One-off usage

For the cases where the setup & teardown are specific to a single test or file, and you don't want to extract it to a utility.

```javascript
import { teardown } from 'jest-teardown';

beforeEach(() => {
  initializeCityDatabase();
  teardown(() => clearCityDatabase()); // will run in `afterEach`
});
beforeAll(() => {
  initializeCityDatabase();
  teardown(() => clearCityDatabase()); // will run in `afterAll`
});
test('my test', () => {
  initializeCityDatabase();
  teardown(() => clearCityDatabase()); // will run after 'my test' completes
  // the rest of the test
});
```


# Motivation

Out-of-the-box, `jest` provides us with some common setup and teardown hooks. While the setup hooks are great, the teardown hooks are ... less so.

In a typical case, a teardown hook cleans up something that's been created in their matching setup hook.
E.g. `afterEach` cleans up `beforeEach`, and `afterAll` cleans up `beforeAll`.
This however creates an implicit coupling between the hooks, which causes unnecessary complexity and fragility in tests.
To illustrate, let's take the example from [Jest's documentation](https://jestjs.io/docs/setup-teardown):

```javascript
beforeEach(() => {
  initializeCityDatabase();
});

afterEach(() => {
  clearCityDatabase();
});
```

**The first issue** that we'll run into is that it's easy to forget to add the teardown hook. And when we forget, this can cause failures in completely unrelated tests.

**The second issue** is that we'll end up duplicating extra logic if multiple tests have similar setup needs.

**The third issue** is that sharing state between the setup to the teardown is rather convoluted, as it needs to be passed through exposed variables in a higher (unrelated) scope.
<details>
<summary>Example</summary>

```javascript
// Server isn't accessed by the tests, but we're still forced to keep track of it for the `afterEach` hook.
let server;

beforeEach(() => {
  server = initializeTestServer();
});

afterEach(() => {
  server?.shutdown();
});
```

-----

</details>


**The fourth issue** is that while we have teardown hooks for "all" and "each" tests, we don't have teardown hooks for individual test. Instead, we'll manually need to teardown using `try-finally` constructs.
<details>
  <summary>Example</summary>

  ```javascript
  // If we only need the city database in some isolated test(s), then we'll need to write something convoluted like this:

  it('does something', () => {
    try {
      initializeCityDatabase();
      /* The actual test */
    } finally {
      clearCityDatabase();
    }
  });

  // And it gets worse when we need to share state with our teardown:

  it('does something', () => {
    let server;
    try {
      server = initializeTestServer();
      /* The actual test */
    } finally {
      server?.shutdown();
    }
  });
  ```

</details>

----

Normally when we're dealing with repetitive code or shared state, we would encapsulate this. We could try this with hooks, but we'll soon find out that this doesn't work very well:

```javascript
function useCityDatabase() {
  beforeEach(() => {
    initializeCityDatabase();
  });
  afterEach(() => {
    clearCityDatabase();
  });
}

describe('my test suite', () {
  useCityDatabase();
});
```

We're very quickly running into problems here:
- It is not clear on the callside if this runs around each test (`beforeEach`), or around the entire suite (`beforeAll`).
- If we want to support bother `beforeEach` and `beforeAll` then we'll need to write multiple flavors of the same function. E.g. `useCityDatabaseEach`/`useCityDatabaseAll`/`useCityDatabase({ scope: 'each'|'all' })`.
- We still can't use this for single tests. We could create yet another variant like `withCityDatabase(() => { /* the test */ })`, but this doesn't stack very well. Imagine needing a few of these for a single test, and you'll see the problem.
- It complicates passing variables from hooks to tests. Let's say that our `beforeEach` creates a test user and we need the users id in our tests. This won't work:
  ```javascript
  describe('my tests', () => {
    const userId = useTestUser();
  });
  ```
  There are creative ways to work around this, but none of these are particularly straightforward.

# The solution

What we really need is a way to attach a teardown hook to some setup, which then automatically runs at the right time. This is what `jest-teardown` does:

```javascript
import { teardown } from 'jest-teardown';

beforeEach(() => {
  initializeCityDatabase();
  teardown(() => clearCityDatabase()); // will run in `afterEach`
});
beforeAll(() => {
  initializeCityDatabase();
  teardown(() => clearCityDatabase()); // will run in `afterAll`
});
test('my test', () => {
  initializeCityDatabase();
  teardown(() => clearCityDatabase()); // will run after 'my test' completes
  // the rest of the test
});
```

The real benefit is that abstractions now become viable!

```javascript
import { teardown } from 'jest-teardown';

function useCityDatabase() {
  initializeCityDatabase();
  // We don't need to know if it's called in a beforeEach, beforeAll, or in a test. jest-teardown handles that for us.
  teardown(() => clearCityDatabase());
}

beforeEach(() => useCityDatabase());
beforeAll(() => useCityDatabase());
test('my test', () => {
  useCityDatabase();
  /* test logic */
});
```

This even works with shared state between setup and teardown:

```javascript
import { teardown } from 'jest-teardown';

function useTestServer() {
  const server = initializeTestServer();
  teardown(() => server.shutdown());
}

beforeEach(() => useTestServer());
beforeAll(() => useTestSErver());
test('my test', () => {
  useTestServer();
  // The rest of the test
});
```

And exposing variables to tests works as expected:

```javascript
import { teardown } from 'jest-teardown';

function useTestUser() {
  const user = initializeTestUser();
  teardown(() => removeTestUser(user));
  return user;
}

let user;
beforeEach(() => user = initializeTestUser());
beforeAll(() => user = initializeTestUser());
test('my test', () => {
  const user = initializeTestUser();
});
```

----

# The fine print

1. `teardown` does not work in `.concurrent` tests. We need to use some shared global state behind the scenes to make it work, which we cannot do in concurrent tests.
2. `jest-teardown` needs to monkey-patch some of the Jest methods to work. If you find that it breaks something, please file an issue [here](https://github.com/TiddoLangerak/jest-teardown/issues)!
