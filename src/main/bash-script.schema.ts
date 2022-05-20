export type Option = {
    name: string
    alias?: string
    documentation: string
    global?: boolean
} & (
    | {
          type: 'flag'
      }
    | {
          type: 'param'
          default?: string
          validation?: {
              required?: boolean
          }
      }
    | {
          type: 'immediate'
          action: string
      }
)

export type PositionalArg = {
    name: string
    validation?: {
        required?: boolean
    }
}

export interface BashScript {
    options: Option[]
    positionalArgs?: PositionalArg[]
}
