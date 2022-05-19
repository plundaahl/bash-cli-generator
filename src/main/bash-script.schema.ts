export interface Option {
    name: string
    alias?: string
    documentation: string
}

export interface BashScript {
    options: Option[]
}
