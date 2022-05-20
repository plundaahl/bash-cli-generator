import { generateBashScript } from './bash-script.generator'

test('Main E2E Test', () => {
    expect(
        generateBashScript({
            options: [
                {
                    name: 'Flag',
                    alias: 'f',
                    documentation: 'Some flag description',
                    type: 'flag',
                },
                {
                    name: 'Param',
                    alias: 'p',
                    documentation: 'Some param description',
                    type: 'param',
                    validation: {
                        required: true,
                    },
                },
            ],
            positionalArgs: [
                { name: 'First Arg', validation: { required: true } },
            ],
        }),
    ).toBe(
        `#!/usr/bin/env bash

set -Eeuo pipefail
trap cleanup SIGINT SIGTERM ERR EXIT

SCRIPT_DIR=$(cd "$(dirname "\${BASH_SOURCE[0]}")" &>/dev/null && pwd -P)

usage() {
    cat <<EOF
Usage: $(basename "\${BASH_SOURCE[0]}") [-h] [-v] [-f] -p param-value arg1 [arg2...]

Script description here.

Available options:

-h, --help      Print this help and exit
-v, --verbose   Print script debug info
-f, --flag      Some flag description
-p, --param     Some param description
EOF
  exit
}

main() {
    # Default values
    VERBOSE=0
    local FLAG=0
    local PARAM=''

    # Parse parameters
    local ARGS=()
    while [ $# -gt 0 ]; do
        case "\${1-}" in
        -h | --help         ) usage ;;
        -v | --verbose      ) VERBOSE=1 ;;
        -f | --flag         ) FLAG=1 ;;
        -p | --param        ) PARAM="\${2-}" ; shift ;;
        -?*                 ) die "Unknown option: $1" ;;
        *                   ) ARGS+=("\${1-}") ;;
        esac
        shift
    done

    # Positional args
    local FIRST_ARG="\${ARGS[0]-}"; ARGS=("\${ARGS[@]:1}") # shift array

    # check required params and arguments
    [[ -z "\${PARAM-}" ]] && die "Missing required parameter: param"
    [[ -z "\${FIRST_ARG-}" ]] && die "Missing required argument: first-arg"

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
`,
    )
})
