// The `define` function value is passed in at the end of this file.
(define => define([], () => {

var funcProxy = new Proxy({}, {
    get: (_, tag) => (...rest) => [tag, ...rest]
});

var parseOptions = options => ({
    result: '',
    indentString: options.indentString || ' '.repeat(2),
    doctype: options.doctype,
    indentLevel: options.indentLevel || 0,
    dom: options.dom
});

var escapeInnerText = text =>
    text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

var escapeAttributeValue = text =>
    escapeInnerText(text)
        // We quote attribute values using double quotes, so only those need
        // be escaped (not single quotes).
        .replace(/"/g, "&quot;");

var isObject = value =>
    typeof value === 'object' &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype;

var indentation = options => options.result += options.indentString.repeat(options.indentLevel);


var renderAttributes = (options, attributes) => {
    for (let [name, value] of Object.entries(attributes)) {
        // We don't check the correctness of the attribute name.
        options.result += ` ${name}="`;
        switch (typeof value) {
        case 'string':
            break;
        case 'number':
        case 'boolean':
            value = value.toString();
            break;
        default:
            throw Error(`Invalid type for attribute value.  Type must be string, number, or boolean.  Offending value is ${value} in ${attributes}`);
        }
        options.result += `${escapeAttributeValue(value)}"`;
    }
};

// HTML tags that shall not have children, and so must be self-closing (or,
// equivalently, unclosed).
// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#void-elements
const voidElements = [
    'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
    'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
];

var renderArray = (options, array) => {
    if (!Array.isArray(array)) {
        throw Error(`Expected an array, but instead got: ${array}`);
    }

    if (array.length === 0) {
        throw Error('An empty array cannot be converted into HTML.');
    }

    const tag = array[0];
    indentation(options);
    options.result += `<${tag}`;

    const closeChildlessTag = () => {
        // Tag might be self-closing.  Otherwise, close it.
        if (voidElements.indexOf(tag.toLowerCase()) !== -1) {
            options.result += ' />';
        } else {
            options.result += `></${tag}>`;
        }
        options.result += '\n';
    }

    if (array.length === 1) {
        return closeChildlessTag();      
    }
    
    let children;
    if (isObject(array[1])) {
        // attributes
        renderAttributes(options, array[1]);
        if (array.length === 2) {
            // no children
            return closeChildlessTag();
        }
        children = array.slice(2);
    } else {
        children = array.slice(1);
    }
    
    // there is at least one child
    options.result += '>';
    
    // <pre> has special handling
    if (tag.toLowerCase() === 'pre') {
        if (children.length !== 1 || typeof children[0] !== 'string') {
            throw Error(`<pre> element must contain at most one child, and the child must be a string.  Error occurred for: ${array}`);
        }
        options.result += escapeInnerText(children[0]);
        options.result += `</${tag}>\n`;
        return;
    }

    options.result += '\n';
    ++options.indentLevel;
    for (const child of children) {
        // strings are special
        if (typeof child === 'string') {
            indentation(options);
            options.result += escapeInnerText(child);
            options.result += '\n';
        // numbers are special
        } else if (typeof child === 'number') {
            indentation(options);
            options.result += child.toString();
            options.result += '\n';
        } else {
            render(options, child);
        }
    }
    --options.indentLevel;
    indentation(options);
    options.result += `</${tag}>\n`;
}

var render = (options, ...rest) => {
    for (const arg of rest) {
        if (Array.isArray(arg)) {
            renderArray(options, arg);
        } else if (typeof arg === 'function') {
            renderArray(options, arg(funcProxy));
        } else {
            throw Error(`Element value has incompatible type.  Must be array or function.  Value is: ${first}`);
        }
    }
}

var arrayToDOM = array => {
    if (array.length === 0) {
        throw Error(`DOM element cannot be created from an empty array.`);
    }
    const [tag, ...rest] = array;
    const result = document.createElement(tag);
    if (rest.length === 0) {
        return result;
    }

    let children;
    if (isObject(rest[0])) {
        const attributes = rest[0];
        for (let [name, value] of Object.values(attributes)) {
            switch (typeof value) {
            case 'string':
                break;
            case 'number':
            case 'boolean':
                value = value.toString();
                break;
            default:
                throw Error(`Invalid type for attribute value.  Type must be string, number, or boolean.  Offending value is ${value} in ${attributes}`);
            }
            result.setAttribute(name, value);
        }
        children = rest.slice(1);
    } else {
        children = rest;
    }

    for (const child of children) {
        result.appendChild(toDOM(child));
    }

    return result;
}

var toDOM = value => {
    switch (typeof value) {
    case 'string':
        return new Text(value);
    case 'number':
        return new Text(value.toString());
    case 'function':
        return toDOM(value(funcProxy));
    }

    if (!Array.isArray(value)) {
        throw Error(`DOM elements can be made from arrays, functions, strings, and numbers, but not: ${value}`);
    }
    return arrayToDOM(value);
}

var js2html = (first, ...rest) => {
    let options;
    let args;
    if (isObject(first)) {
        options = parseOptions(first);
        args = rest;
    } else {
        options = parseOptions({});
        args = [first, ...rest];
    }

    if (options.dom) {
        if (args.length !== 1) {
            throw Error(`DOM variant of js2html takes only one argument after the options object. arguments: ${args}`);
        }
        return toDOM(args[0]);
    }

    if (options.doctype) {
        let doctype;
        if (typeof options.doctype === 'string') {
            doctype = options.doctype;
        } else {
            doctype = 'html';
        }
        options.result += `<!DOCTYPE ${doctype}>\n`;
    }

    render(options, ...args);
    return options.result;
}

return js2html;

}))(typeof define === 'undefined' ?
         (_, func) => module.exports = func() :
         define)
