import { it } from 'node:test';
import { strictEqual, deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./VisitManagement.tsx', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  const removeVisitFromPackage ='), source.indexOf('\n  const filteredUsers'));

async function runRemoval(fails = false) {
  const calls: unknown[] = [];
  let pending: unknown = null;
  let refreshed = false;
  const context = {
    removingPackageId: null,
    setRemovingPackageId: (id: unknown) => { pending = id; },
    supabase: { rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return { error: fails ? new Error('Update rejected') : null };
    } },
    toast: () => {},
    fetchData: async () => { refreshed = true; },
    console: { error: () => {} },
    remove: undefined as undefined | ((id: string) => Promise<void>),
  };
  const compiled = ts.transpileModule(`${handler}\nglobalThis.remove = removeVisitFromPackage;`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  runInNewContext(compiled, context);
  if (!context.remove) throw new Error('Remove handler unavailable');
  await context.remove('selected-package');
  return { calls: JSON.parse(JSON.stringify(calls)), pending, refreshed };
}

it('decrement targets exactly the selected package and refreshes after success', async () => {
  const result = await runRemoval();
  deepStrictEqual(result.calls, [{ name: 'undo_visit_package', args: { p_package_id: 'selected-package' } }]);
  strictEqual(result.refreshed, true);
  strictEqual(result.pending, null);
});

it('failed decrement releases the button without pretending the count changed', async () => {
  const result = await runRemoval(true);
  strictEqual(result.refreshed, false);
  strictEqual(result.pending, null);
});