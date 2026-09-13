import glspConfig from '@eclipse-glsp/eslint-config';

/**
 * Import specifiers that resolve to the importing module's own directory barrel or to one of its
 * parent barrels, up to `depth` levels: `'.'`, `'..'`, `'../..'`, ...
 */
function ownAndParentBarrels(depth) {
    return [
        '.',
        ...Array.from({ length: depth }, (_, level) =>
            Array(level + 1)
                .fill('..')
                .join('/')
        )
    ];
}

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
    // Published packages must declare what they import. The e2e test package is exempt: it is
    // private and legitimately consumes its devDependencies from specs and configs.
    {
        files: ['packages/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}', 'e2e/playwright-theia/**/*.{ts,tsx}'],
        rules: {
            'import-x/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: false,
                    peerDependencies: true
                }
            ]
        }
    },
    // E2E packages (migrated from glsp-playwright). Kept in sync with the equivalent block in
    // glsp-core, which owns the framework these packages build on.
    {
        files: ['e2e/**/*.{ts,tsx}'],
        rules: {
            // A dangling promise in a page object silently drops the Playwright action it wraps.
            '@typescript-eslint/no-floating-promises': 'error',
            // Playwright's API returns `null` for absent elements, which the page objects pass through.
            'no-null/no-null': 'off',
            // The typescript-eslint variant is required for `allowTypeImports` below.
            'no-restricted-imports': 'off',
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [
                        // `'.'`, `'..'`, `'../..'`, ... resolve to an own or parent barrel, which
                        // re-exports the importing module itself. Type-only is fine, because the
                        // import erases; a value import closes a runtime cycle and yields a
                        // partially initialized module.
                        ...ownAndParentBarrels(10).map(name => ({
                            name,
                            allowTypeImports: true,
                            message:
                                'Importing an own or parent barrel closes a runtime import cycle. Import the defining ' +
                                'module directly, or keep the import type-only with `import type`.'
                        })),
                        { name: 'src' }
                    ],
                    patterns: [
                        { group: ['**/../index'] },
                        {
                            group: [
                                '@eclipse-glsp/playwright*/src/**',
                                '@eclipse-glsp/playwright*/lib/**',
                                '@eclipse-glsp-examples/workflow-e2e*/src/**',
                                '@eclipse-glsp-examples/workflow-e2e*/lib/**'
                            ],
                            message:
                                'Import from the package root instead. Deep imports are resolved by the Playwright require hook ' +
                                'and load a second copy of the module graph. If a symbol is unreachable, export it from the barrel.'
                        }
                    ]
                }
            ]
        }
    }
];
