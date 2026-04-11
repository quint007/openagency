import type { Block } from 'payload'

export const CodeBlock: Block = {
  slug: 'codeBlock',
  interfaceName: 'CodeBlock',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'Bash',
          value: 'bash',
        },
        {
          label: 'CSS',
          value: 'css',
        },
        {
          label: 'JSON',
          value: 'json',
        },
        {
          label: 'Markdown',
          value: 'markdown',
        },
      ],
      required: true,
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}
