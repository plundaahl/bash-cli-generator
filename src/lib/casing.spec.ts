import {
    pipe,
    capitalize,
    startCase,
    constCase,
    pascalCase,
    kebabCase,
    camelCase,
} from './casing'

describe('capitalize', () => {
    test('works for single words', () => {
        expect(capitalize('foo')).toBe('Foo')
    })
})

describe('startCase', () => {
    test.each([
        ['foo bar baz', 'Foo Bar Baz'],
        ['FOO BAR BAZ', 'Foo Bar Baz'],
    ])('Transforms "%s" to "%s"', (input, expected) => {
        expect(startCase(input)).toBe(expected)
    })
})

describe('constCase', () => {
    test.each([
        ['foo bar baz', 'FOO_BAR_BAZ'],
        ['FOO BAR BAZ', 'FOO_BAR_BAZ'],
    ])('Transforms "%s" to "%s"', (input, expected) => {
        expect(constCase(input)).toBe(expected)
    })
})

describe('pascalCase', () => {
    test.each([
        ['foo bar baz', 'FooBarBaz'],
        ['FOO BAR BAZ', 'FooBarBaz'],
    ])('Transforms "%s" to "%s"', (input, expected) => {
        expect(pascalCase(input)).toBe(expected)
    })
})

describe('camelCase', () => {
    test.each([
        ['foo bar baz', 'fooBarBaz'],
        ['FOO BAR BAZ', 'fooBarBaz'],
    ])('Transforms "%s" to "%s"', (input, expected) => {
        expect(camelCase(input)).toBe(expected)
    })
})

describe('kebabCase', () => {
    test.each([
        ['foo bar baz', 'foo-bar-baz'],
        ['FOO BAR BAZ', 'foo-bar-baz'],
    ])('Transforms "%s" to "%s"', (input, expected) => {
        expect(kebabCase(input)).toBe(expected)
    })
})
