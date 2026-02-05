#!/usr/bin/env node
/**
 * Wrapper to fix uv_interface_addresses error on some systems.
 * Patches os.networkInterfaces to return empty object on failure instead of crashing.
 */
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  const mod = originalRequire.apply(this, arguments);
  if (id === 'os' && mod.networkInterfaces) {
    const orig = mod.networkInterfaces.bind(mod);
    mod.networkInterfaces = function () {
      try {
        return orig();
      } catch (e) {
        return {};
      }
    };
  }
  return mod;
};

// Set argv so next sees: next dev -H 127.0.0.1
const nextPath = require.resolve('next/dist/bin/next');
process.argv = [process.argv[0], nextPath, ...process.argv.slice(2)];

require('next/dist/bin/next');
