import * as expect from 'expect';
import * as fs from 'fs';
import * as fiddleFiles from '../../../util/fiddle-files';

describe('fiddle files', () => {
  describe('fiddle file for source', () => {
    it('without source->fiddle map, gets fiddle file for cljc file', function () {
      expect(fiddleFiles.getFiddleForSourceFile('/u/p/src/a/b/c-d.cljc', '/u/p', null)).toBe(
        '/u/p/src/a/b/c-d.fiddle'
      );
    });
    it('with source->fiddle map, gets fiddle file for cljc file', function () {
      expect(
        fiddleFiles.getFiddleForSourceFile('/u/p/src/a/b/c-d.cljc', '/u/p', [
          { source: ['src'], fiddle: ['dev'] },
        ])
      ).toBe('/u/p/dev/a/b/c-d.cljc');
    });
    it('with source->fiddle map with several matching source mappings, gets fiddle file for first', function () {
      expect(
        fiddleFiles.getFiddleForSourceFile('/u/p/src/a/b/c-d.cljc', '/u/p', [
          { source: ['no-match'], fiddle: ['no-fiddle'] },
          { source: ['src'], fiddle: ['first'] },
          { source: ['src'], fiddle: ['second'] },
        ])
      ).toBe('/u/p/first/a/b/c-d.cljc');
    });
    it('throws when no source mapping', function () {
      expect(() =>
        fiddleFiles.getFiddleForSourceFile('/u/p/src/a/b/c-d.cljc', '/u/p', [
          { source: ['no-match'], fiddle: ['no-fiddle'] },
        ])
      ).toThrow();
    });
    it('throws when project root does not match', function () {
      expect(() =>
        fiddleFiles.getFiddleForSourceFile('/u/p/src/a/b/c-d.cljc', '/u/p-no', [
          { source: ['no-match'], fiddle: ['no-fiddle'] },
          { source: ['src'], fiddle: ['first'] },
          { source: ['src'], fiddle: ['second'] },
        ])
      ).toThrow();
    });
  });

  describe('source for fiddle file', () => {
    describe('source base', () => {
      it('without fiddle->source map, gets source base for fiddle file', function () {
        expect(
          fiddleFiles.getSourceBaseForFiddleFile('/u/p/src/a/b/c-d.fiddle', '/u/p', null)
        ).toBe('/u/p/src/a/b/c-d');
      });
      it('with fiddle->source map, gets source base for fiddle file', function () {
        expect(
          fiddleFiles.getSourceBaseForFiddleFile('/u/p/dev/a/b/c-d.clj', '/u/p', [
            { source: ['src'], fiddle: ['dev'] },
          ])
        ).toBe('/u/p/src/a/b/c-d');
      });
      it('with fiddle->source map with several matching source mappings, gets fiddle file for first', function () {
        expect(
          fiddleFiles.getSourceBaseForFiddleFile('/u/p/dev/a/b/c-d.cljc', '/u/p', [
            { source: ['no-source'], fiddle: ['no-match'] },
            { source: ['first'], fiddle: ['dev'] },
            { source: ['second'], fiddle: ['dev'] },
          ])
        ).toBe('/u/p/first/a/b/c-d');
      });
      it('throws when no fiddle mapping', function () {
        expect(() =>
          fiddleFiles.getSourceBaseForFiddleFile('/u/p/dev/a/b/c-d.fiddle', '/u/p', [
            { source: ['no-source'], fiddle: ['no-match'] },
          ])
        ).toThrow();
      });
      it('throws when project root does not match', function () {
        expect(() =>
          fiddleFiles.getSourceBaseForFiddleFile('/u/p/dev/a/b/c-d.cljc', '/u/p-no', [
            { source: ['no-source'], fiddle: ['no-match'] },
            { source: ['first'], fiddle: ['dev'] },
            { source: ['second'], fiddle: ['dev'] },
          ])
        ).toThrow();
      });
    });

    describe('source file', () => {
      const mockWorkspace: fiddleFiles.Workspace = {
        findFiles: (pattern: string) => {
          return Promise.resolve([
            { fsPath: '/u/p/src/a/b/c-d.clj' },
            { fsPath: '/u/p/src/a/b/c-d.cljc' },
          ]);
        },
      };
      it('without fiddle->source map, gets cljc source file for fiddle file', async function () {
        expect(
          await fiddleFiles.getSourceForFiddleFile(
            '/u/p/src/a/b/c-d.fiddle',
            '/u/p',
            null,
            mockWorkspace,
            ['cljc', 'clj']
          )
        ).toBe('/u/p/src/a/b/c-d.cljc');
      });
      it('with fiddle->source map, gets source clj for clj fiddle file', async function () {
        expect(
          await fiddleFiles.getSourceForFiddleFile(
            '/u/p/dev/a/b/c-d.clj',
            '/u/p',
            [{ source: ['src'], fiddle: ['dev'] }],
            mockWorkspace
          )
        ).toBe('/u/p/src/a/b/c-d.clj');
      });
      it('with fiddle->source map, gets source bb for bb fiddle file', async function () {
        expect(
          await fiddleFiles.getSourceForFiddleFile(
            '/u/p/dev/a/b/c-d.bb',
            '/u/p',
            [{ source: ['src'], fiddle: ['dev'] }],
            mockWorkspace
          )
        ).toBe('/u/p/src/a/b/c-d.bb');
      });
    });
  });
});
