/** Split only an explicit, consecutive numbered list; leave free-form questions intact. */
export function splitNumberedQuestions(input: string): string[] {
  const text = input.trim();
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 5) return [text];
  const questions: string[] = [];
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^([1-5])[.)]\s*(?:savol\s*:\s*)?(.+)$/iu);
    if (!match || Number(match[1]) !== index + 1 || match[2].trim().length < 3) return [text];
    questions.push(match[2].trim());
  }
  return questions;
}
