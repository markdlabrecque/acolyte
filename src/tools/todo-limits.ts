// A title is JSON-encoded in the tool result, then that result is encoded again
// in model input. A control character or lone surrogate costs at most 7 bytes
// per UTF-16 code unit after both encodings. Metadata fits in another 256 bytes.
export const TODO_TITLE_LENGTH = 500;
export const TODO_INPUT_BYTES = TODO_TITLE_LENGTH * 7 + 256;

// Allow space for tool schemas, message envelopes, a short listing request,
// the assistant tool call, the page cursor and the inference guard's 1024 bytes.
// This does not promise that arbitrary conversation history will fit.
export function minimumListInputTokens(page: number, prompt: string): number {
  return page * TODO_INPUT_BYTES + Buffer.byteLength(JSON.stringify(prompt)) + 8192;
}
