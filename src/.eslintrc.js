module.exports = {
  env: {
    browser: true
  },
  rules: {
    'import/extensions': ['warn', {jsx: 'always'}],
    'import/no-extraneous-dependencies': ['warn', {devDependencies: true}]
  }
};
