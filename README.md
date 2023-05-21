# Test hooks done right

Out-of-the-box, `jest` provides us with some setup and teardown hooks. While the setup hooks work great, the teardown hooks not so much.

So, what's the problem? There's 2:

First: in a typical case, a teardown hook cleans up something that's being created in their corresponding setup hook.
E.g. code in an `afterEach` typically cleans up `beforeEach`, and `afterAll` typically cleans up `beforeAll`.
This however creates an implicit coupling between the hooks which causes unnecessary complexity and fragility in tests.
To illustrate, let's take the example from [Jest's documentation](https://jestjs.io/docs/setup-teardown):

```javascript
beforeEach(() => {
  initializeCityDatabase();
});

afterEach(() => {
  clearCityDatabase();
});
```

Let's now also assume that we'll need the city database in multiple tests.

The first issue that we'll run into is that it's easy to forget to setup the cleanup hook. And when we forget, this might cause failures in completely unrelated tests.
The second issue is that we'll end up adding a lot of repetitive code to multiple tests.
The third issue is that passing information from the setup to the teardown is rather convoluted, and needs to be passed through exposed variables in a higher scope.
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
</details>

The fourth issue is that while we have cleanup hooks for "all" and "each" tests, we don't have cleanup hooks for individual test. Instead, we'll manually need to deal with this using `try-finally` hooks.
<details>
  <summary>Code example</summary>
  E.g. suppose we only need `initializeCityDatabase` in a single test. We'll then need to write it as such:

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

  And even worse is when combined with issue 3:

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

</details>

Normally, when we're dealing with repetitive code, or code that always must come together, we would encapsulate this, e.g. by putting it in a function. Let's try this with hooks.
A naive approach would be to just put the entire snippet above in a function. E.g.:

```javascript
export function useCityDatabase() {
  beforeEach(() => {
    initializeCityDatabase();
  });
  afterEach(() => {
    clearCityDatabase();
  });
}


///

describe('my test suite', () {
  useCityDatabase();
});
```

But we're very quickly running into problems here:
- What if some of our tests want a `beforeEach`, and others `beforeAll`? This would require us to have 2 functions, or a parameterized function. E.g. `useCityDatabaseEach`/`useCityDatabaseAll`/`useCityDatabase({ scope: 'each'|'all'})`.
- We can't reuse this for single tests. We could create yet another variant like `withCityDatabase(() => { /* the test */ })`, but these don't stack very well. Imagine needed a few of these for a single test, and you'll see the problem.
- How would we pass variables from the hook to our test? Let's say that our `beforeEach` creates a test user and we need the users id in our tests. This won't work:
  ```
  describe('my tests', () => {
    const userId = useTestUser();
  });
  ```

# The solution
What we really want is a way to contextually attach a teardown hook to some setup, which then automatically runs at the right time. This is what `jest-cleanup` does:

```
import { cleanup } from 'jest-cleanup';

beforeEach(() => {
  initializeCityDatabase();
  cleanup(() => clearCityDatabase()); // will run in `afterEach`
});
beforeAll(() => {
  initializeCityDatabase();
  cleanup(() => clearCityDatabase()); // will run in `afterAll`
});
test('my test', () => {
  initializeCityDatabase();
  cleanup(() => clearCityDatabase()); // will run after 'my test' completes
  // the rest of the test
});
```

The real benefit now comes from the fact that suddenly our `useCityDatabase` method becomes viable, and we can abstract it all away!

```
import { cleanup } from 'jest-cleanup';

function useCityDatabase() {
  initializeCityDatabase();
  cleanup(() => clearCityDatabase());
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
import { cleanup } from 'jest-cleanup';

function useTestServer() {
  const server = initializeTestServer();
  cleanup(() => server.shutdown());
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
import { cleanup } from 'jest-cleanup';

function useTestUser() {
  const user = initializeTestUser();
  cleanup(() => removeTestUser(user));
  return user;
}

let user;
beforeEach(() => user = initializeTestUser());
beforeAll(() => user = initializeTestUser());
test('my test', () => {
  const user = initializeTestUser();
});
```
