import { constCase, kebabCase } from '../lib/casing'
import { BashScript, Option, PositionalArg } from './bash-script.schema'

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
