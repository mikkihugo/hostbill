import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', 'test/.placeholder']
  },
  {
    files: [
      'app/**/*.{js,jsx,ts,tsx}',
      'src/lib/**/*.js',
      'src/main.js',
      'remix.config.js',
      'server.js'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      indent: 'off', // Prettier handles indentation
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      'no-console': ['warn'],
      'no-debugger': ['error'],
      'no-alert': ['error'],
      'no-eval': ['error'],
      'no-implied-eval': ['error'],
      'no-new-func': ['error'],
      'no-script-url': ['error'],
      'no-self-compare': ['error'],
      'no-sequences': ['error'],
      'no-throw-literal': ['error'],
      'no-unused-expressions': ['error'],
      'no-useless-call': ['error'],
      'no-useless-concat': ['error'],
      'no-void': ['error'],
      'prefer-promise-reject-errors': ['error'],
      'require-await': ['error'],
      'no-return-await': ['error'],
      'prefer-const': ['error'],
      'no-var': ['error'],
      'object-shorthand': ['error'],
      'prefer-arrow-callback': ['error'],
      'prefer-template': ['error'],
      'template-curly-spacing': ['error'],
      'arrow-spacing': ['error'],
      'comma-dangle': ['error', 'never'],
      'comma-spacing': ['error'],
      'comma-style': ['error'],
      'computed-property-spacing': ['error'],
      'func-call-spacing': ['error'],
      'key-spacing': ['error'],
      'keyword-spacing': ['error'],
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'no-trailing-spaces': ['error'],
      'object-curly-spacing': ['error', 'always'],
      'space-before-blocks': ['error'],
      'space-before-function-paren': 'off', // Prettier handles this
      'space-in-parens': ['error'],
      'space-infix-ops': ['error'],
      'space-unary-ops': ['error'],
      'spaced-comment': ['error'],
      eqeqeq: ['error'],
      'no-implicit-coercion': ['error'],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          enforceConst: true
        }
      ],
      radix: ['error'],
      yoda: ['error'],
      camelcase: ['error', { properties: 'never' }],
      'capitalized-comments': ['warn'],
      'consistent-this': ['error'],
      'func-name-matching': ['error'],
      'func-names': ['error', 'as-needed'],
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'k', 'x', 'y', 'z'] }],
      'max-depth': ['error', 4],
      'max-lines': ['warn', 1000],
      'max-lines-per-function': ['warn', 100],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 5],
      'max-statements': ['warn', 30],
      'max-statements-per-line': ['error'],
      'new-cap': ['error'],
      'no-array-constructor': ['error'],
      'no-lonely-if': ['error'],
      'no-mixed-operators': ['warn'],
      'no-multi-assign': ['error'],
      'no-nested-ternary': ['error'],
      'no-new-object': ['error'],
      'no-unneeded-ternary': ['error'],
      'one-var': ['error', 'never'],
      'operator-assignment': ['error'],
      'prefer-object-spread': ['error']
    }
  },
  {
    files: ['test/**/*.test.js'],
    rules: {
      'no-console': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off'
    }
  },
  {
    files: ['app/**/*.{jsx,tsx}'],
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^[A-Z]',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  }
];
