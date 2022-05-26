import { indent } from '../lib/casing'
import { BashScript, Option } from './bash-script.schema'
import { generateUsage } from './usage.generator'
import { generateLib } from './lib.generator'
import { generateArgParser } from './parser.generator'
import { generateArgValidators } from './validator.generator'

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

${generateLib()}

main "$@"
`
}
