import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesProductRouteId} from '../src/lib/productRouteId.ts';
test('static catalog UUIDs open the app-prefixed product, including old links',()=>{
  assert.ok(matchesProductRouteId('shared-abc-123','abc-123'));
  assert.ok(matchesProductRouteId('shared-abc-123','shared-abc-123'));
  assert.ok(matchesProductRouteId('local-5','local-5'));
  assert.equal(matchesProductRouteId('shared-abc-123','different-123'),false);
});
