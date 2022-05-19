import { indent, kebabCase } from '../lib/casing'
import { BashScript, Option } from './bash-script.schema'

const SPACE = ' '
const WRAP_COLUMN = 80

export const generateOptionDocs = (schema: Option[]) => {
    const allOptions: Option[] = [
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
        name: [alias, name]
            .filter(Boolean)
            .map(kebabCase)
            .map((text) => (text.length === 1 ? `-${text}` : `--${text}`))
            .join(', '),
    }))

    const longestOptionText = optionsIr.reduce(
        (maxLength, option) => Math.max(option.name.length, maxLength),
        0,
    )

    const docsColumn = Math.ceil(longestOptionText / 4) * 4

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

export const generateArgDefaults = () =>
    `VERBOSE=0
local FLAG=0
local PARAM=''`

export const generateArgParseStatements = () =>
    `-h | --help         ) usage ;;
-v | --verbose      ) VERBOSE=1 ;;
-f | --flag         ) FLAGF=1 ;;
-p | --param        ) PARAM="\${2-}" ; shift ;;
-?*                 ) die "Unknown option: $1" ;;
*                   ) ARGS+=("\${1-}") ;;`

export const generatePositionalParseStatements = () =>
    `local FIRST_ARG="\${ARGS[0]-}"; ARGS=("\${ARGS[@]:1}") # shift array`

export const generateArgValidators = () =>
    `[[ -z "\${PARAM-}" ]] && die "Missing required parameter: param"
[[ -z "\${FIRST_ARG-}" ]] && die "Missing argument: first arg"`

export const generateArgParser = () =>
    `# Default values
${generateArgDefaults()}

# Parse parameters
local ARGS=()
while [ $# -gt 0 ]; do
    case "\${1-}" in
${indent(generateArgParseStatements(), 4)}
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
${indent(generateArgParser(), 4)}

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
