#!/usr/bin/env node

const path = require('path')

const compareHandler = require('./lib/compare')
const extractHandler = require('./lib/extract')

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .usage('Usage: $0 [options]')
  .command(
    'extract',
    'Extract bytecode',
    yargs => {
      yargs
        .option('build-dir', {
          alias: 'b',
          coerce: buildDir => path.resolve(process.cwd(), buildDir),
          default: 'build/contracts',
          describe: 'Directory of truffle build files',
          type: 'string',
        })
        .option('output', {
          alias: 'o',
          coerce: output => path.resolve(process.cwd(), output),
          default: 'bytecode',
          describe: 'Output directory of extracted files',
          type: 'string',
        })
        .option('compile', {
          alias: 'c',
          default: 'true',
          describe: 'Compile before extracting',
          type: 'boolean',
        })
    },
    extractHandler
  )
  .command(
    'compare',
    'Compare bytecode sets',
    yargs => {
      yargs
        .usage('Usage: $0 compare <old> <new>')
        .option('suppress-same', {
          alias: 's',
          default: 'true',
          describe: "Don't output files whose bytecode hasn't changed",
          type: 'boolean',
        })
        .demandCommand(
          2,
          'Two directories must be given (first containing the original bytecode)'
        )
    },
    compareHandler
  )
  .option('warning', {
    alias: 'w',
    default: true,
    describe: 'Output warnings',
    group: 'Verbosity',
    type: 'boolean',
  })
  .option('verbose', {
    alias: 'v',
    default: false,
    describe: 'Output verbosely',
    group: 'Verbosity',
    type: 'boolean',
  })
  .demandCommand(1, 'You need to use a command').argv
