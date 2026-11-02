import { it } from 'node:test';
import { strictEqual, rejects, deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function service(rpcError: unknown = null, authResult: unknown = { data: { success: true }, error: null }) {
  const calls: unknown[] = [];
  const source = readFileSync(new URL('./userDeletionService.ts', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace('export class', 'class');
  const context = { supabase: {
    rpc: async (name: string, args: unknown) => { calls.push({ name, args }); return { error: rpcError }; },
    functions: { invoke: async (name: string, args: unknown) => { calls.push({ name, args }); return authResult; } },
  }, service: undefined as undefined | { deleteUserData(user: unknown): Promise<void> } };
  runInNewContext(ts.transpileModule(`${source}\nglobalThis.service=UserDeletionService;`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText, context);
  if (!context.service) throw new Error('Service missing');
  return { run: context.service.deleteUserData.bind(context.service), calls };
}

it('deletes selected user in one transaction and then its own Auth account', async () => {
  const s = service();
  await s.run({ id: 'user-1', auth_user_id: 'auth-1' });
  deepStrictEqual(JSON.parse(JSON.stringify(s.calls)), [
    { name: 'admin_delete_athlete', args: { athlete_id: 'user-1' } },
    { name: 'delete-auth-user', args: { body: { authUserId: 'auth-1' } } },
  ]);
});
it('a failed transaction does not delete Auth', async () => {
  const s = service({ code: '23503', message: 'dependency' });
  await rejects(s.run({ id: 'user-1', auth_user_id: 'auth-1' }));
  strictEqual(s.calls.length, 1);
});
it('Auth failure is not reported as successful deletion', async () => {
  const s = service(null, { data: { error: 'failed' }, error: null });
  await rejects(s.run({ id: 'user-1', auth_user_id: 'auth-1' }));
});
it('Auth deletion can be retried after data deletion has completed', async () => {
  const s = service({ code: 'P0002', message: 'User not found' });
  await s.run({ id: 'user-1', auth_user_id: 'auth-1' });
  strictEqual(s.calls.length, 2);
});
it('a user without Auth only needs the transaction', async () => {
  const s = service();
  await s.run({ id: 'user-1', auth_user_id: null });
  strictEqual(s.calls.length, 1);
});