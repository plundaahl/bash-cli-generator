import {
    indent,
    max,
    constCase,
    optionCase,
    nextColumnGivenLength,
} from '../lib/casing'
import { BashScript, Option, PositionalArg } from './bash-script.schema'

const MIN_ARG_PARSE_ACTION_COLUMN = 16

/**
 * Generates statements to initialize the defaults for command-line options.
 */
export const generateVariableDefaults = (schema: Option[]) =>
    schema
        .filter((opt) => opt.type !== 'immediate')
        .map((option) => {
            const name = constCase(option.name)
            const scope = option.global ? '' : 'local '
            switch (option.type) {
                case 'flag':
                    return `${scope}${name}=0`
                case 'param':
                    return `${scope}${name}='${option.default || ''}'`
            }
        })
        .join('\n')

/**
 * Generates statements for parsing parameters and flags.
 */
export const generateOptionParseStatements = (schema: Option[]) => {
    const inputOptionsIr = schema
        .map((option) => ({
            option,
            matchStr: [option.alias, option.name]
                .filter(Boolean)
                .map(optionCase)
                .join(' | '),
        }))
        .map(({ matchStr, option }) => {
            const varName = constCase(option.name)
            switch (option.type) {
                case 'flag':
                    return { matchStr, action: `${varName}=1` }
                case 'param':
                    return { matchStr, action: `${varName}="\${2-}" ; shift` }
                case 'immediate':
                    return { matchStr, action: option.action }
            }
        })

    const optionsIr = [
        ...inputOptionsIr,
        { matchStr: '-?*', action: 'die "Unknown option: $1"' },
        { matchStr: '*', action: 'ARGS+=("${1-}")' },
    ]

    const longestOptionText = optionsIr
        .map(({ matchStr }) => matchStr.length)
        .reduce(max, MIN_ARG_PARSE_ACTION_COLUMN)

    const actionCol = nextColumnGivenLength(longestOptionText)

    return optionsIr
        .map(
            ({ matchStr, action }) =>
                `${matchStr.padEnd(actionCol)}) ${action} ;;`,
        )
        .join('\n')
}

/**
 * Generates statements for parsing positional arguments.
 */
export const generatePositionalParseStatements = (schema: PositionalArg[]) => {
    return schema
        .map((arg) => {
            const varName = constCase(arg.name)
            const scopeStr = arg.global ? '' : 'local '
            return `${scopeStr}${varName}="\${ARGS[0]-}"; ARGS=("\${ARGS[@]:1}") # shift array`
        })
        .join('\n')
}

/**
 * Generates statements for an argument parsing block, including default
 * values, options, and positional arguments.
 */
export const generateArgParser = (schema: BashScript) =>
    `# Default values
${generateVariableDefaults(schema.options)}

# Parse parameters
local ARGS=()
while [ $# -gt 0 ]; do
    case "\${1-}" in
${indent(generateOptionParseStatements(schema.options), 4)}
    esac
    shift
done

# Positional args
${generatePositionalParseStatements(schema.positionalArgs || [])}`
