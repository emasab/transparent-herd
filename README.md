# Transparent herd

## What is this?

It's a Node.js package for grouping singular calls into bulk or batch calls, transparently to the caller

## What does that mean?

\- _As you know most of times grouping your calls, for example you database writes, into a bulk one can greatly improve your performance, even of an order of magnitude._

\- _Yes_

\- _Then, why don't you change your code to take advantage of that?_

\- _It's complicated, all our calls are single ones, it would require the entire rewrite of our service, including changing the way the clients call our API._

\- _Well, with this package you can change only your database access code, for example, and keep the rest of the application using singular calls._

\- _Cool! Show me an example._

## Example
