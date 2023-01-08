// The `define` function value is given a value at the end of this file.
(define => define([], () => {

var funcProxy = new Proxy({}, {
    get: (_, tag) => (...rest) => [tag, ...rest]
});

var parseOptions = options => ({
    result: '',
    indentString: options.indentString || ' '.repeat(2),
    doctype: options.doctype,
    indentLevel: options.indentLevel || 0
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
            value = value.toString();
            break;
        default:
            throw Error(`Invalid type for attribute value.  Type must be string or number.  Offending value is ${value} in ${attributes}`);
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

var render = (options, first, ...rest) => {
    if (Array.isArray(first)) {
        renderArray(options, first);
    } else if (typeof first === 'function') {
        renderArray(options, first(funcProxy));
    } else {
        throw Error(`Element value has incompatible type.  Must be array or function.  Value is: ${first}`);
    }

    if (rest.length) {
        throw Error(`Unexpected trailing arguments: ${rest}`);
    }
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
