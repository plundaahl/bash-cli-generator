import { indent, max, constCase, optionCase, kebabCase } from '../lib/casing'
import { BashScript, Option, PositionalArg } from './bash-script.schema'

const nextColumnGivenLength = (len: number) => Math.ceil((len + 1) / 4) * 4
const MIN_ARG_PARSE_ACTION_COLUMN = 16

const UNIVERSAL_OPTS: Option[] = [
    {
        type: 'immediate',
        name: 'help',
        alias: 'h',
        documentation: 'Print this help and exit',
        action: 'usage',
    },
    {
        type: 'flag',
        name: 'verbose',
        alias: 'v',
        documentation: 'Print script debug info',
        global: true,
    },
]

export const generateOptionDocs = (schema: Option[]) => {
    const allOptions: Pick<Option, 'name' | 'alias' | 'documentation'>[] = [
        ...schema,
    ]

    const optionsIr = allOptions.map(({ alias, name, documentation }) => ({
        docs: documentation,
        name: [alias, name].filter(Boolean).map(optionCase).join(', '),
    }))

    const longestOptionText = optionsIr
        .map(({ name }) => name.length)
        .reduce(max, 0)

    const docsColumn = nextColumnGivenLength(longestOptionText)

    return optionsIr
        .map(({ name, docs }) => `${name.padEnd(docsColumn)}${docs}`)
        .join('\n')
}

const generateArgUsageString = (schema: BashScript) =>
    (schema.positionalArgs || []).map((arg) => kebabCase(arg.name)).join(' ')

export const generateUsage = (schema: BashScript) => {
    const argUsage = generateArgUsageString(schema)

    return `usage() {
    cat <<EOF
Usage: $(basename "\${BASH_SOURCE[0]}") [options] ${argUsage} [args...]

Script description here.

Available options:

${generateOptionDocs(schema.options)}
EOF
  exit
}`
}

export const generateArgDefaults = (schema: Option[]) =>
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

export const generatePositionalParseStatements = (schema: PositionalArg[]) => {
    return schema
        .map((arg) => {
            const varName = constCase(arg.name)
            const scopeStr = arg.global ? '' : 'local '
            return `${scopeStr}${varName}="\${ARGS[0]-}"; ARGS=("\${ARGS[@]:1}") # shift array`
        })
        .join('\n')
}

export const generateArgValidators = (schema: BashScript) => {
    const paramIrs = schema.options
        .filter((opt) => opt.type === 'param' && opt.validation)
        .flatMap((opt: Option & { type: 'param' }) => {
            if (opt.validation?.required) {
                const varName = constCase(opt.name)
                const optName = kebabCase(opt.name)
                const condition = `[[ -z "\${${varName}-}" ]]`
                const message = `die "Missing required parameter: ${optName}"`

                return `${condition} && ${message}`
            }
        })
        .filter(Boolean)

    const positionalArgIrs = (schema.positionalArgs || [])
        .filter((arg) => arg.validation?.required)
        .flatMap((arg: PositionalArg) => {
            if (arg.validation?.required) {
                const varName = constCase(arg.name)
                const optName = kebabCase(arg.name)
                const condition = `[[ -z "\${${varName}-}" ]]`
                const message = `die "Missing required argument: ${optName}"`
                return `${condition} && ${message}`
            }
        })

    const allValidators = [...paramIrs, ...positionalArgIrs]

    return `# check required params and arguments
${allValidators.join('\n')}`
}

export const generateArgParser = (schema: BashScript) =>
    `# Default values
${generateArgDefaults(schema.options)}

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

// MAIN FUNCTION
export const generateBashScript = (baseSchema: BashScript) => {
    const schema: BashScript = {
        ...baseSchema,
        options: [...UNIVERSAL_OPTS, ...baseSchema.options],
    }

    return `#!/usr/bin/env bash

set -Eeuo pipefail
trap cleanup SIGINT SIGTERM ERR EXIT

SCRIPT_DIR=$(cd "$(dirname "\${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

${generateUsage(schema)}

main() {
${indent(generateArgParser(schema), 4)}

${indent(generateArgValidators(schema), 4)}

    action

    return 0
}

cleanup() {
    trap - SIGINT SIGTERM ERR EXIT
    # script cleanup here
}

action() {
    # some action
    msg "Some action"
}

msg() {
    echo >&2 -e "\${1-}"
}

verbose() {
    [[ $VERBOSE -eq 1 ]] && msg "$@"
}

die() {
    local msg=$1
    local code=\${2-1} # default exit status 1
    msg "$msg"
    exit "$code"
}

main "$@"
`
}
