const truffleExtract = require('truffle-extract')

const { BYTECODE_KEY, DEPLOYED_BYTECODE_KEY } = require('./constants')

const extractHandler = argv => {
  const buildDir = argv['build-dir']
  const outputDir = argv.output
  const compile = argv.compile
  const warning = argv.warning
  const verbose = argv.verbose

  if (!verbose) {
    console.log('Extracting...')
  }

  truffleExtract(
    [BYTECODE_KEY, DEPLOYED_BYTECODE_KEY],
    {
      buildDir,
      outputDir,
      compile,
      warning,
      verbose,
    },
    err => {
      console.error('Unexpected error:', err)
      process.exit(1)
    }
  )
}

module.exports = extractHandler
