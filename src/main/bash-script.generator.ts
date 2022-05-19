import { indent, max, constCase, optionCase } from '../lib/casing'
import { BashScript, Option } from './bash-script.schema'

const nextColumnGivenLength = (len: number) => Math.ceil((len + 1) / 4) * 4

export const generateOptionDocs = (schema: Option[]) => {
    const allOptions: Pick<Option, 'name' | 'alias' | 'documentation'>[] = [
        { name: 'help', alias: 'h', documentation: 'Print this help and exit' },
        {
            name: 'verbose',
            alias: 'v',
            documentation: 'Print script debug info',
        },
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

export const generateUsage = (schema: BashScript) =>
    `usage() {
    cat <<EOF
Usage: $(basename "\${BASH_SOURCE[0]}") [-h] [-v] [-f] -p param_value arg1 [arg2...]

Script description here.

Available options:

${generateOptionDocs(schema.options)}
EOF
  exit
}`

export const generateArgDefaults = (schema: Option[]) => {
    const lines = schema.map((option) => {
        const name = constCase(option.name)
        switch (option.type) {
            case 'flag':
                return `local ${name}=0`
            case 'param':
                return `local ${name}='${option.default || ''}'`
        }
    })

    return [`VERBOSE=0`, ...lines].join('\n')
}

export const generateArgParseStatements = (schema: Option[]) => {
    const inputOptionsIr = schema
        .map((option) => ({
            option,
            matchStr: [option.alias, option.name]
                .filter(Boolean)
                .map(optionCase)
                .join(' | '),
        }))
        .map(({ matchStr, option: { type, name } }) => {
            const varName = constCase(name)
            switch (type) {
                case 'flag':
                    return { matchStr, action: `${varName}=1` }
                case 'param':
                    return { matchStr, action: `${varName}="\${2-}" ; shift` }
            }
        })

    const optionsIr = [
        { matchStr: '-h | --help', action: 'usage' },
        { matchStr: '-v | --verbose   ', action: 'VERBOSE=1' },
        ...inputOptionsIr,
        { matchStr: '-?*', action: 'die "Unknown option: $1"' },
        { matchStr: '*', action: 'ARGS+=("${1-}")' },
    ]

    const longestOptionText = optionsIr
        .map(({ matchStr }) => matchStr.length)
        .reduce(max, 0)

    const actionCol = nextColumnGivenLength(longestOptionText)

    return optionsIr
        .map(
            ({ matchStr, action }) =>
                `${matchStr.padEnd(actionCol)}) ${action} ;;`,
        )
        .join('\n')
}

export const generatePositionalParseStatements = () =>
    `local FIRST_ARG="\${ARGS[0]-}"; ARGS=("\${ARGS[@]:1}") # shift array`

export const generateArgValidators = () =>
    `[[ -z "\${PARAM-}" ]] && die "Missing required parameter: param"
[[ -z "\${FIRST_ARG-}" ]] && die "Missing argument: first arg"`

export const generateArgParser = (schema: BashScript) =>
    `# Default values
${generateArgDefaults(schema.options)}

# Parse parameters
local ARGS=()
while [ $# -gt 0 ]; do
    case "\${1-}" in
${indent(generateArgParseStatements(schema.options), 4)}
    esac
    shift
done

# Positional args
${generatePositionalParseStatements()}

# check required params and arguments
${generateArgValidators()}`

// MAIN FUNCTION
export const generateBashScript = (schema: BashScript) =>
    `#!/usr/bin/env bash

set -Eeuo pipefail
trap cleanup SIGINT SIGTERM ERR EXIT

SCRIPT_DIR=$(cd "$(dirname "\${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

${generateUsage(schema)}

main() {
${indent(generateArgParser(schema), 4)}

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
