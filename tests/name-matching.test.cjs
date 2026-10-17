const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.createContext(context);
vm.runInContext(ts.transpileModule(fs.readFileSync('src/utils/name-matching.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context);
const { parseProfessorName, professorNamesMatch } = context.exports;

test('preserves surname particles and matches spaced and joined RMP surnames', () => {
  assert.equal(JSON.stringify(parseProfessorName('Darryl De Ruiter')),
    JSON.stringify({ given: ['darryl'], surname: ['de', 'ruiter'] }));
  for (const variant of ['De Ruiter, Darryl', 'Darryl DeRuiter', 'DE RUITER D']) {
    assert(professorNamesMatch('Darryl De Ruiter', variant));
    assert(professorNamesMatch(variant, 'Darryl De Ruiter'));
  }
});

test('a shared surname particle or different given name does not establish identity', () => {
  assert(!professorNamesMatch('Darryl De Ruiter', 'Darryl De Smith'));
  assert(!professorNamesMatch('Darryl De Ruiter', 'David De Ruiter'));
});

test('existing registrar and GPA compound name variants still match', () => {
  assert(professorNamesMatch('Arroyo Relion, Jesus', 'Jesus Arroyo'));
  assert(professorNamesMatch('ARROYO RELION J', 'Jesus Arroyo'));
  assert(!professorNamesMatch('Alice Smith', 'Andrew Smith'));
});
