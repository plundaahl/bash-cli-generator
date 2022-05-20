export type Option = {
    name: string
    alias?: string
    documentation: string
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
)

export interface BashScript {
    options: Option[]
}
