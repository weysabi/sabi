import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(import.meta.dir, "..");

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next"]);
const SKIP_FILES = new Set(["bun.lock", "rename-sabi-to-weysabi.ts"]);

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) files.push(...walk(full));
    } else if (entry.isFile() && !SKIP_FILES.has(entry.name)) {
      // Only text-like files
      const ext = entry.name.split(".").pop()?.toLowerCase();
      if (["ts", "tsx", "js", "json", "md", "yml", "yaml", "txt", "sh", "env.example"].includes(ext ?? "")) {
        files.push(full);
      }
    }
  }
  return files;
}

const files = walk(ROOT);
let changed = 0;

// Pattern: standalone `sabi` (lowercase) not part of `weysabi` or similar
// Using regex with word boundaries: \bsabi\b matches `sabi` but not `weysabi`
const SABI_RE = /\bsabi\b/g;
const SABI_UPPER_RE = /\bSABI_/g;

for (const file of files) {
  try {
    let content = readFileSync(file, "utf-8");
    const original = content;
    const rel = relative(ROOT, file).replace(/\\/g, "/");

    // Skip if file contains "weysabi" but not standalone "sabi" — optimization
    if (!content.includes("sabi")) continue;

    // Replace SABI_ → WEYSABI_ first (uppercase env vars)
    content = content.replace(SABI_UPPER_RE, "WEYSABI_");

    // Replace standalone `sabi` → `weysabi`
    // This catches: variable names, CLI commands, paths, comments, strings
    // but NOT `weysabi`, `Weysabi`, `createWeysabi`, etc. because `\b` won't match
    content = content.replace(SABI_RE, "weysabi");

    // Fix the double-replacement: weysabiweysabi → weysabi
    // This could happen if e.g., `sabi` was already part of `weysabi` getting
    // re-replaced, but with word boundaries this shouldn't happen.
    // Just in case:
    content = content.replace(/weysabiweysabi/g, "weysabi");

    if (content !== original) {
      writeFileSync(file, content);
      changed++;
      if (changed <= 30) console.log(`  ${rel}`);
    }
  } catch {
    // binary or unreadable, skip
  }
}

console.log(`\nUpdated ${changed} files.`);
