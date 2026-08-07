/** The upload affordance, kept wired while attachments are out of service.
 *
 * A file the user attaches is currently accepted and then discarded: the
 * assistant has no way to reach one. The transport is being redesigned around
 * an S3 upload the agent reads through MCP tools, so the reading, sizing and
 * media-type detection that used to live here is deleted rather than rewritten
 * — none of it survives that change. See ngs360-f2w.11.
 *
 * What is left is the accept list, which does survive it, so the paperclip
 * still behaves like itself when the wire is reconnected.
 */

/** Extensions the picker offers.
 *
 * Matched on extension rather than `File.type`, which is unreliable for exactly
 * these formats — a .csv is `application/vnd.ms-excel` on some platforms and
 * `''` on others.
 */
export const ACCEPTED_ATTACHMENTS = ['.csv', '.tsv', '.txt', '.md', '.json']

/** For an `<input type="file">` accept attribute and the dropzone. */
export const ATTACHMENT_ACCEPT = ACCEPTED_ATTACHMENTS.join(',')

/** The same list as prose, for the paperclip's tooltip. */
export const ACCEPTED_ATTACHMENTS_LABEL = ACCEPTED_ATTACHMENTS.join(', ')

/** What the user is told when they attach something.
 *
 * Here rather than at the call site so there is one string to delete when
 * uploads start working.
 */
export const ATTACHMENTS_DISABLED_NOTICE =
  "The assistant can't read attached files yet — this one wasn't sent."
