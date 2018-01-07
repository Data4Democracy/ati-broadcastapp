// deep copy
const base = JSON.parse(JSON.stringify(
  require('eslint-config-airbnb-base/rules/style.js')));

// make no-trailing-spaces, comma-dangle a warning, rather than an error
const noTrailingSpaces = base.rules['no-trailing-spaces'];
noTrailingSpaces[0] = 'warn';

const commaDangle = base.rules['comma-dangle'];
commaDangle[0] = 'warn';

let noRestrictedSyntax = base.rules['no-restricted-syntax'];
noRestrictedSyntax = noRestrictedSyntax.filter(
  obj => ! (obj.selector === 'ForOfStatement'));

const baseEs6 = JSON.parse(JSON.stringify(
  require('eslint-config-airbnb-base/rules/es6.js')));
let preferDestructuring = baseEs6.rules['prefer-destructuring'];
preferDestructuring[0] = 'warn';
preferDestructuring[1].AssignmentExpression.array = false;

module.exports = {
  extends: 'airbnb',
  rules: {
    'no-restricted-syntax': noRestrictedSyntax,
    'no-use-before-define': [
      'error', { functions: false, classes: true, variables: true }],
    'max-len': ['warn', {
      code: 80,
      comments: 10000,
      ignoreUrls: true,
    }],
    'no-underscore-dangle': ['warn', {allow: ['_id', '_debug']}],
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': [
      'warn', {args: 'none', varsIgnorePattern: '^_'}],
    'no-unused-expressions': ["error", { allowShortCircuit: true }],
    'quote-props' : ['warn', 'consistent-as-needed'],
    'no-trailing-spaces': noTrailingSpaces,
    'comma-dangle': commaDangle,
    'prefer-destructuring': preferDestructuring,
  }
};

(['no-else-return', 'no-multi-spaces',
  'function-paren-newline', 'object-curly-newline',
  'import/prefer-default-export', 'no-console', 'prefer-template',
  'no-useless-return']
 .map(key => module.exports.rules[key] = ['off']));

