const parent = require('../.eslintrc');

//  for reference, currently the following yields:
//        ['warn', {allow: ['_id']}]
const noUnderscoreDangleOpts = parent.rules['no-underscore-dangle'];
// console.log(noUnderscoreDangleOpts);
(noUnderscoreDangleOpts[1]).allow.push('_isMounted');

module.exports = {
  env: {
    browser: true
  },
  rules: {
    'import/extensions': ['warn', {jsx: 'always'}],
    'import/no-extraneous-dependencies': ['warn', {devDependencies: true}],
    'no-underscore-dangle': noUnderscoreDangleOpts,
    //  this is buggy
    'jsx-a11y/anchor-is-valid': ['off'],
  }
};
