// Taken from https://github.com/toolness/slowmo-js.

function defaultInserter (name) {
  return function (node) {
    return name + '();'
  }
}

const LOOP_CHECK_FUNC_NAME = '__loopCheck'

export default function LoopInserter (fn) {
  return function (node) {
    if (
      node.type === 'ForStatement' ||
      node.type === 'WhileStatement' ||
      node.type === 'DoWhileStatement'
    ) {
      const loopCheckCode = {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: LOOP_CHECK_FUNC_NAME
          },
          arguments: [
            {
              type: 'Literal',
              value: JSON.stringify(node.range)
            }
          ]
        }
      }

      if (node.body.type === 'BlockStatement') {
        // Insert the loop check at the beginning of the block
        node.body.body.unshift(loopCheckCode)
      } else {
        // Wrap the single statement body in a block and insert the loop check
        node.body = {
          type: 'BlockStatement',
          body: [loopCheckCode, node.body]
        }
      }
    }
    return ''
  }
}
