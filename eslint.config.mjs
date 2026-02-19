import glspConfig from '@eclipse-glsp/eslint-config';

export default [
    ...glspConfig,
    // Ignore JS config/build files that are not part of the TS project
    {
        ignores: ['**/*.js', '**/*.mjs', '**/*.cjs']
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
    }
];
