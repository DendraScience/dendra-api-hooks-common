// SEE: http://eslint.org/docs/user-guide/configuring
module.exports = {
  env: {
    'mocha': true
  },
  extends: 'standard',
  globals: {
    assert: true,
    expect: true
  },
  root: true,
  parserOptions: {
    sourceType: 'module'
  }
}
