# Transparent herd

## What is this?

It's a Node.js package for grouping singular calls into bulk or batch calls, transparently to the caller

## What does that mean?

\- _As you know most of times grouping your calls, for example you database writes, into a bulk one can greatly improve your performance, even of an order of magnitude._

\- _Yes_

\- _Then, why don't you change your code to take advantage of that?_

\- _It's complicated, all our calls are singular ones, it would require the entire rewrite of our service, including changing the way the clients call our API._

\- _Well, with this package you can change only your database access code, for example, and keep the rest of the application using singular calls._

\- _Cool! Show me an example._

## Example

in this example the singular call to MongoDB's insertOne
is converted to an insertMany in the batched function.

```javascript
type SingularCallFunction = (...args: any[]) => Promise<any>;

/*
 * The batched function gets an array of function arguments and returns an array of promises
 */
const batched = async (args: object[][]): Promise<Promise<any>[]> => {
  // the object to insert is the first argument of each list of arguments
  const documents = args.map((arg) => arg[0]);
  try {
    const result = await collection.insertMany(documents);
    return documents.map(() => Promise.resolve(result));
  } catch (e) {
    return documents.map(() => Promise.reject(e));
  }
};

/*
 * This way you get a singular function out of the batched one
 */
const singular: SingularCallFunction = transparentHerd.singular(batched, { maxBatchSize });

/*
 * Then you can use the singular function just as before
 */
const allPromises = [];
for (let i = 0; i < numCalls; i++) {
  allPromises.push(singular({ a: i }));
}
```

The mean execution time out of 100 rounds was 12.8 times smaller with the convertion to bulk insert. See [transparent-herd-test](https://github.com/emasab/transparent-herd-test)

## Documentation

### The singular function

It converts a batched functions to a singular one. If maxBatchSize is undefined,
only one batched call at a time is done, otherwise calls with batches of at most maxBatchSize can be run in parallel

### Params

**batched:** the batched function takes an array of arguments and returns an array of promises

**maxBatchSize** if undefined, only one batch is run at a time, otherwise _n_ batches of at most _maxBatchSize_ can be run in parallel

### Returns

the singular function, taking different arguments and returning a promise
