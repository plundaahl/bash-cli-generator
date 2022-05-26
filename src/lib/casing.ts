const TAB_SIZE = 4

// Composition Tools
export const pipe =
    <T>(...fns: { (arg: T): T }[]): { (arg: T): T } =>
    (arg: T) =>
        fns.reduce((result, fn) => fn(result), arg)

// Casing
export const uppercase = (param: string) => param.toUpperCase()
export const lowercase = (param: string) => param.toLowerCase()
export const trim = (param: string) => param.trim()

export const capitalize = (param: string) =>
    uppercase(param.slice(0, 1)) + lowercase(param.slice(1))

export const startCase = (param: string) =>
    param.split(' ').map(capitalize).join(' ')

export const constCase = (param: string) =>
    param.split(' ').map(uppercase).join('_')

export const pascalCase = (param: string) =>
    param.split(' ').map(capitalize).join('')

export const kebabCase = (param: string) =>
    param.split(' ').map(lowercase).join('-')

export const camelCase = pipe(
    pascalCase,
    (str: string) => lowercase(str.slice(0, 1)) + str.slice(1),
)

const prefixWithOptionDash = (str: string) =>
    str.length === 1 ? `-${str}` : `--${str}`

export const optionCase = pipe(kebabCase, prefixWithOptionDash)

// String
export const padEnd = (param: string, length: number) =>
    param.padEnd(length, ' ')

export const padStart = (param: string, length: number) =>
    param.padStart(length, ' ')

export const spaces = (length: number) => ''.padEnd(length, ' ')

export const indent = (text: string, depth: number) =>
    text
        .split('\n')
        .map((line) => (line.length > 0 ? `${spaces(depth)}${line}` : line))
        .join('\n')

// Numbers
export const max = (a: number, b: number) => Math.max(a, b)

// Indentation
export const nextColumnGivenLength = (len: number) =>
    Math.ceil((len + 1) / TAB_SIZE) * TAB_SIZE
