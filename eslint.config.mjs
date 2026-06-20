import glspConfig from '@eclipse-glsp/eslint-config';

export default [
    ...glspConfig,
    // Ignore JS config/build files that are not part of the TS project, and worktrees
    {
        ignores: ['**/*.js', '**/*.mjs', '**/*.cjs', '.worktrees/']
    },
    // Apply parserOptions.project only to TypeScript files
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname
            }
        }
    },
    {
        files: ['packages/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}'],
        rules: {
            'import-x/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: false,
                    peerDependencies: true
                }
            ]
        }
    }
];
