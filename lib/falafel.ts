// This is an older version of falafel that used esprima instead of acorn.
// Taken from https://github.com/toolness/slowmo-js.

import esprima = require('esprima')

let parse = esprima.parse

export default function (src, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts
    opts = {}
  }
  if (typeof src === 'object') {
    opts = src
    src = opts.source
    delete opts.source
  }
  src = src || opts.source
  opts.range = true
  if (typeof src !== 'string') src = String(src)

  var ast = parse(src, opts)

  var result = {
    chunks: src.split(''),
    toString: function () {
      return result.chunks.join('')
    },
    inspect: function () {
      return result.toString()
    }
  }
  var index = 0

  ;(function walk (node, parent) {
    insertHelpers(node, parent, result.chunks)
    node = addCapturer(node, result.chunks)
    Object.keys(node).forEach(function (key) {
      if (key === 'parent') return

      var child = node[key]
      if (Array.isArray(child)) {
        child.forEach(function (c) {
          if (c && typeof c.type === 'string') {
            walk(c, node)
          }
        })
      } else if (child && typeof child.type === 'string') {
        insertHelpers(child, node, result.chunks)
        walk(child, node)
      }
    })

    fn(node)
  })(ast, undefined)

  return result
}

function insertHelpers (node, parent, chunks) {
  if (!node.range) return

  node.parent = parent

  node.source = function () {
    return chunks.slice(node.range[0], node.range[1]).join('')
  }

  if (node.update && typeof node.update === 'object') {
    var prev = node.update
    Object.keys(prev).forEach(function (key) {
      update[key] = prev[key]
    })
    node.update = update
  } else {
    node.update = update
  }

  function update (s) {
    chunks[node.range[0]] = s
    for (var i = node.range[0] + 1; i < node.range[1]; i++) {
      chunks[i] = ''
    }
  }
}

function addCapturer (node, chunks) {
  // Check if the node is a function declaration named 'draw'
  if (
    node.type === 'FunctionDeclaration' &&
    node.id &&
    node.id.name === 'draw'
  ) {
    console.log('#Found draw function:', node)

    let hasCapturerStart = false
    let hasCapturerEnd = false

    // Traverse the function body to check for `capturer_start()` and `capturer_end()`
    ;(function checkCapturerCalls (bodyNode) {
      if (
        bodyNode.type === 'CallExpression' &&
        bodyNode.callee &&
        bodyNode.callee.type === 'Identifier'
      ) {
        if (bodyNode.callee.name === 'capturer_start') {
          hasCapturerStart = true
        } else if (bodyNode.callee.name === 'capturer_end') {
          hasCapturerEnd = true
        }
      }
      if (bodyNode.body && Array.isArray(bodyNode.body)) {
        bodyNode.body.forEach(checkCapturerCalls)
      }
    })(node.body)

    if (!hasCapturerStart) {
      console.log('capturer_start() not found in draw function, adding it.')
      const startInsertPos = node.body.range[0] + 1
      chunks.splice(startInsertPos, 0, 'capturer_start();\n')
    }

    if (!hasCapturerEnd) {
      console.log('capturer_end() not found in draw function, adding it.')
      const endInsertPos = node.body.range[1] - 1
      chunks.splice(endInsertPos, 0, '\ncapturer_end();')
    }
  }

  return node
}
