# Jest-teardown

_teardown hooks done right._

`teardown` is a hook that runs at the end of the current scope:

- When placed in a `beforeEach`, it'll run as `afterEach`
- When placed in a `beforeAll`, it'll run as `afterAll`
- When placed in a test, it'll run at the end of the test

This allows to put setup & teardown together in reusable utility functions, which can be used in any desired scope.

# Usage
Using the example from [Jest's documentation](https://jestjs.io/docs/setup-teardown), with an `initializeCityDatabase` setup method and a `clearCityDatabase` teardown method:

## Idiomatic usage

For when you have commonly used setup & teardown routines.

```javascript
// test-utils/city-database.js
import { teardown } from 'jest-teardown';

export function useCityDatabase() {
  initializeCityDatabase();
  teardown(() => clearCityDatabase());
}

// my-test.spec.js
import { useCityDatabase } from './test-utils/city-database';

// setup in `beforeEach`, teardown in `afterEach`
beforeEach(() => useCityDatabase());
// setup in `beforeAll`, teardown in `afterAll`
beforeAll(() => useCityDatabase());
// setup in test, teardown at the end of the test
test('my test', () => {
  useCityDatabase();
  /* rest of the test */
});
```


## One-off usage

For the cases where the setup & teardown are specific to a single test/test-file.

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

Out-of-the-box, `jest` provides us with some setup and teardown hooks. While the setup hooks are great, the teardown hooks are not so much.

In a typical case, a teardown hook cleans up something that's being created in their corresponding setup hook.
E.g. code in an `afterEach` cleans up `beforeEach`, and `afterAll` cleans up `beforeAll`.
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

**The second issue** is that we'll end up adding code if multiple tests need access to the same city database.

**The third issue** is that sharing state between the setup to the teardown is rather convoluted, as it needs to be passed through exposed variables in a higher scope.
<details>
<summary>In depth</summary>

To illustrate, let's take a different scenario. In this scenario, we have a test server that needs to be shut down:

```javascript
let server;

beforeEach(() => {
  server = initializeTestServer();
});

afterEach(() => {
  server?.shutdown();
});
```
Even though our tests are not using `server` directly, it still needs to do the bookkeeping to be able to tear down correctly.

-----

</details>


**The fourth issue** is that while we have teardown hooks for "all" and "each" tests, we don't have teardown hooks for individual test. Instead, we'll manually need to teardown using `try-finally` constructs.
<details>
  <summary>In depth</summary>

  Suppose we only need `initializeCityDatabase` in a single test. We'll then need to write it as such:

  ```javascript
  it('does something', () => {
    try {
      initializeCityDatabase();
      /* The actual test */
    } finally {
      clearCityDatabase();
    }
  });
  ```

  And even worse is when combined with the previous issue, where we need to share state between setup and teardown:

  ```javascript
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

  This adds unnecessary boilerplate to the tests, and make them far less readable.

  ----

</details>

Normally when we're dealing with repetitive code, or tightly coupled logic, we would encapsulate this. We could try this with hooks, but we'll soon find out that this doesn't work very well.
A naive approach would be to just put the entire snippet above in a function. E.g.:

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
- What if some of our tests want a `beforeEach`, and others `beforeAll`? This would require us to have multiple flavors of the same function. E.g. `useCityDatabaseEach`/`useCityDatabaseAll`/`useCityDatabase({ scope: 'each'|'all'})`.
- We still can't use this for single tests. We could create yet another variant like `withCityDatabase(() => { /* the test */ })`, but these don't stack very well. Imagine needing a few of these for a single test, and you'll see the problem.
- How would we pass variables from the hook to our test? Let's say that our `beforeEach` creates a test user and we need the users id in our tests. This won't work:
  ```
  describe('my tests', () => {
    const userId = useTestUser();
  });
  ```
  There are creative ways to make these work, but none of these are clean and straightforward.

# The solution
What we really want is a way to contextually attach a teardown hook to some setup, which then automatically runs at the right time. This is what `jest-teardown` does:

```
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

The real benefit now is that suddenly our `useCityDatabase` method is viable, and we can abstract it all away!

```
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
  // The rest of the test
});
```

We can also abstract away any additional bookkeeping:

```
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

```
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
