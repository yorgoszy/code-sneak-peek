import { it } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./VisitManagement.tsx', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  const addVisitToPackage ='), source.indexOf('  const removeVisitFromPackage ='));

it('manual package attendance persists the selected user, section and package', async () => {
  const calls: unknown[] = [];
  const context = {
    pendingPackageVisit: { packageId: 'package-1', userId: 'user-1' }, visitSectionId: 'section-1',
    setVisitSectionId: () => {}, setPendingPackageVisit: () => {},
    supabase: { rpc: async (name: string, args: unknown) => { calls.push({ name, args }); return { error: null }; } },
    toast: () => {}, fetchData: () => {}, console,
    add: undefined as undefined | ((packageId: string, userId: string) => Promise<void>),
  };
  runInNewContext(ts.transpileModule(`${handler}\nglobalThis.add=addVisitToPackage;`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, context);
  if (!context.add) throw new Error('Attendance handler missing');
  await context.add('package-1', 'user-1');
  deepStrictEqual(JSON.parse(JSON.stringify(calls)), [{ name: 'record_section_visit', args: { p_user_id: 'user-1', p_package_id: 'package-1', p_section_id: 'section-1', p_notes: 'Προσθήκη από πακέτο επισκέψεων' } }]);
  context.visitSectionId = '';
  await context.add('package-1', 'user-1');
  strictEqual(calls.length, 1);
});