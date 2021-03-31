module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    'padded-blocks': 'off',
    'no-case-declarations': 'off',
    'object-curly-newline': 'off',
    'no-trailing-spaces': [
      0,
    ],
    'dot-notation': 'off',
    'eol-last': 2,
    'no-plusplus': 'off',
    'no-nested-ternary': 'off',
    'no-else-return': 'off',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'state',
          'acc',
          'e',
        ],
      },
    ],
    indent: 'off',
    'template-curly-spacing': 'off',
    'vue/require-v-for-key': 'off',
    'vue/script-indent': [
      'warn',
      2,
      {
        baseIndent: 1,
      },
    ],
    'vue/max-attributes-per-line': 'off',
    'max-len': 'off',
    'no-underscore-dangle': [1, { allowAfterThis: true }],
    "@typescript-eslint/no-this-alias": [
      "error",
      {
        "allowDestructuring": true, // Allow `const { props, state } = this`; false by default
        "allowedNames": ["self", "that"] // Allow `const self = this`; `[]` by default
      }
    ]
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
