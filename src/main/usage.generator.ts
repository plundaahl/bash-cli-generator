import {
    max,
    optionCase,
    kebabCase,
    nextColumnGivenLength,
} from '../lib/casing'
import { BashScript, Option } from './bash-script.schema'

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
