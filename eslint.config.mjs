import glspConfig from '@eclipse-glsp/eslint-config';
import path from 'node:path';
// Enforce honest dependency declarations for the published packages, which are consumed by external users.
const publishedPackage = name => ({
    files: [`packages/${name}/**/*.{ts,tsx}`],
    rules: {
        'import-x/no-extraneous-dependencies': [
            'error',
            {
                packageDir: path.join(import.meta.dirname, 'packages', name),
                devDependencies: false,
                peerDependencies: true
            }
        ]
    }
});

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
    // Enforce honest dependency declarations for the published packages
    publishedPackage('theia-integration'),
    publishedPackage('theia-mcp-integration')
];
