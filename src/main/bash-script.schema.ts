export type Option = {
    name: string
    alias?: string
    documentation: string
} & ({ type: 'flag' } | { type: 'param'; default?: string; required?: boolean })

export interface BashScript {
    options: Option[]
}
