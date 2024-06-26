import { z } from 'zod'

import { nanoidSchema } from '../shared'

/**
 * Server variables
 *
 * @see https://spec.openapis.org/oas/v3.1.0#server-variable-object
 */
export type ServerVariable = z.TypeOf<typeof serverVariableSchema>
export const serverVariableSchema = z.object({
  uid: nanoidSchema,
  /** An enumeration of string values to be used if the substitution options are from a limited set. The array MUST NOT be empty. */
  enum: z.array(z.string()).optional(),
  /**
   * REQUIRED. The default value to use for substitution, which SHALL be sent if an alternate value is not supplied.
   * Note this behavior is different than the Schema Object’s treatment of default values, because in those cases
   * parameter values are optional. If the enum is defined, the value MUST exist in the enum’s values.
   */
  default: z.string(),
  /** An optional description for the server variable. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
})

/**
 * Server object
 *
 * @see https://spec.openapis.org/oas/v3.1.0#server-object
 */
export type Server = z.TypeOf<typeof serverSchema>
export const serverSchema = z.object({
  uid: nanoidSchema,
  /**
   * REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location
   * is relative to the location where the OpenAPI document is being served. Variable substitutions will be made when a variable is
   * named in {brackets}.
   */
  url: z.string().url(),
  /** An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** A map between a variable name and its value. The value is used for substitution in the server’s URL template. */
  variables: z.record(z.string(), serverVariableSchema).optional(),
})
