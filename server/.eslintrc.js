module.exports = {
  env: {
    node: true
  },
  rules: {
    'no-unused-vars': ['warn', {argsIgnorePattern: '^_|next'}]
  }
};
