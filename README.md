js2html
=======
Convert Javascript object/array literals into HTML.

Or, convert Javascript function invocation expressions into HTML.

Why
---
Template strings work fine, but you have to remember how to escape what where.

Javascript already has recursive literals (`['foo', 2, 3, {"hello": null}]`).
Let's use those instead.

What
----
[js2html.js][1] is an AMD-style and CommonJS-style module that exports a
function that converts nested arrays or nested function calls into a string of
HTML.

How
---
Let's say we're in Node.js.
```javascript
const js2html = require('./js2html.js');

const message = 'You thought you could <pre>vent</pre> escaping?';

let html = js2html(
['html',
  ['head',
    ['meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}],
    ['title', 'example'],
    ['script', {src: 'stuff.js'}]],
  ['body',
    ['p', message, ['br'], 'Nope.']]]);

console.log(html);
// prints:
//
// <!DOCTYPE html>
// <html>
//   <head>
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>
//       example
//     </title>
//     <script src="stuff.js"></script>
//   </head>
//   <body>
//     <p>
//       You thought you could &lt;pre&gt;vent&lt;/pre&gt; escaping?
//       <br />
//       Nope.
//     </p>
//   </body>
// </html>

// Using alternative syntax:
html = js2html($ =>
$.html(
  $.head(
    $.meta({name: 'viewport', content: 'width=device-width, initial-scale=1'}),
    $.title('example'),
    $.script({src: 'stuff.js'})),
  $.body(
    $.p(message, $.br, 'Nope.'))));

console.log(html);
// Prints the same thing as before.

// Options can be passed to `js2html` as an optional first parameter.
html = js2html({doctype: false, indentString: ' '.repeat(8)},
['table',
  ['tr', ['th', 'row'], ['th', 'value']],
  ...[...Array(5).keys()].map(i =>
    ['tr', ['td', i + 1], ['td', (i+1)*(i+1)]])]);

console.log(html);
// Prints:
//
// <table>
//         <tr>
//                 <th>
//                         row
//                 </th>
//                 <th>
//                         value
//                 </th>
//         </tr>
//         <tr>
//                 <td>
//                         1
//                 </td>
//                 <td>
//                         1
//                 </td>
//         </tr>
//         <tr>
//                 <td>
//                         2
//                 </td>
//                 <td>
//                         4
//                 </td>
//         </tr>
//         <tr>
//                 <td>
//                         3
//                 </td>
//                 <td>
//                         9
//                 </td>
//         </tr>
//         <tr>
//                 <td>
//                         4
//                 </td>
//                 <td>
//                         16
//                 </td>
//         </tr>
//         <tr>
//                 <td>
//                         5
//                 </td>
//                 <td>
//                         25
//                 </td>
//         </tr>
// </table>

// Not pretty, but consistent.
```

The following options are supported:
```javascript
{
    // doctype is the document type to include in the <!DOCTYPE ...> at the
    // beginning of the output.  If the doctype is falsy, then the
    // <!DOCTYPE ...> is omitted.  It defaults to 'html'.  If the doctype is
    // truthy but not a string, then the default is used instead.
    doctype: string | falsy,  // 'html'

    // indentString is repeated on the left margin for every level of
    // indentation.  It defaults to two spaces.
    indentString: string,  // '  '

    // indentLevel is the initial level of indentation.  It defaults to zero.
    indentLevel: integer  // 0
}
```

[1]: ./js2html.js
