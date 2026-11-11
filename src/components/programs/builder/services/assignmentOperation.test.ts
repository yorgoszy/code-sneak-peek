import { it } from 'node:test';
import { strictEqual } from 'node:assert';
import { createAssignmentOperation, assignedProgramCopy, isProgramLibraryEntry } from './assignmentOperation.ts';

it('blocks repeated assignment clicks until the first operation finishes', () => {
  const operation = createAssignmentOperation();
  strictEqual(operation.acquire(), true);
  strictEqual(operation.acquire(), false);
  operation.release();
  strictEqual(operation.acquire(), true);
});

it('keeps personalized assigned copies out of drafts', () => {
  const copy = assignedProgramCopy({ id: 'source', status: 'draft', is_template: true }, 'user-1', []);
  strictEqual(copy.id, undefined);
  strictEqual(copy.user_id, 'user-1');
  strictEqual(copy.status, 'active');
  strictEqual(copy.is_template, false);
  strictEqual(isProgramLibraryEntry(copy), false);
  strictEqual(isProgramLibraryEntry({ status: 'draft', user_id: null }), true);
  strictEqual(isProgramLibraryEntry({ status: 'active', user_id: 'user-1', is_template: true }), true);
});