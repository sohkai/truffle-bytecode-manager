const fs = require('fs')
const path = require('path')
const columnify = require('columnify')

const { BYTECODE_KEY, DEPLOYED_BYTECODE_KEY } = require('./constants')
const GAS_COST_PER_BYTE = 200

const errorHandler = err => console.error('Unexpected failure:', err)

const isDirectory = path => {
  try {
    const stat = fs.lstatSync(path)
    if (stat.isDirectory()) {
      return true
    }
  } catch (e) {}
  return false
}

const compareHandler = argv => {
  // argv._[0] is the command (compare)
  const oldDir = path.resolve(process.cwd(), argv._[1])
  const newDir = path.resolve(process.cwd(), argv._[2])

  const suppressSame = argv['suppress-same']
  const warning = argv.warning
  const verbose = argv.verbose

  if (!isDirectory(oldDir)) {
    errorHandler(`${oldDir} is not a directory or could not be read`)
    return
  }
  if (!isDirectory(newDir)) {
    errorHandler(`${newDir} is not a directory or could not be read`)
    return
  }

  try {
    const oldFiles = fs.readdirSync(oldDir)
    const newFiles = fs.readdirSync(newDir)

    const filesToCompare = oldFiles.filter(f => newFiles.includes(f))
    const uncomparedOld = oldFiles.filter(f => !filesToCompare.includes(f))
    const uncomparedNew = newFiles.filter(f => !filesToCompare.includes(f))

    const diffCache = filesToCompare.reduce((cache, file) => {
      if (verbose) {
        console.log(`Comparing ${file}...`)
      }

      try {
        const oldFile = JSON.parse(
          fs.readFileSync(path.resolve(oldDir, file), 'utf8')
        )
        const newFile = JSON.parse(
          fs.readFileSync(path.resolve(newDir, file), 'utf8')
        )

        if (
          oldFile.hasOwnProperty(BYTECODE_KEY) &&
          oldFile.hasOwnProperty(DEPLOYED_BYTECODE_KEY) &&
          newFile.hasOwnProperty(BYTECODE_KEY) &&
          newFile.hasOwnProperty(DEPLOYED_BYTECODE_KEY)
        ) {
          // Get length diffs of both the initializing and runtime sections
          const bytecodeDiff =
            newFile[BYTECODE_KEY].length - oldFile[BYTECODE_KEY].length
          const runtimeDiff =
            newFile[DEPLOYED_BYTECODE_KEY].length -
            oldFile[DEPLOYED_BYTECODE_KEY].length

          cache[file] = {
            initCode: bytecodeDiff - runtimeDiff,
            runtimeCode: runtimeDiff,
          }
        } else if (warning) {
          console.warn(
            `Warning: ${file} could not be compared due to missing bytecode`
          )
        }
      } catch (e) {
        console.error(`Unable to compare ${file}:`, e)
      }

      return cache
    }, {})

    let columnData = Object.entries(diffCache)
    if (suppressSame) {
      columnData = columnData.filter(
        ([file, diff]) => diff.initCode !== 0 && diff.runtimeCode !== 0
      )
    }
    columnData = columnData.map(([file, diff]) => {
      const runtimeGas = (diff.runtimeCode / 2) * GAS_COST_PER_BYTE // gas cost is 200 bytes, 2 chars make up a byte
      const runtimeGasImprovement = runtimeGas < 0
      return {
        name: file,
        'initialization bytes': diff.initCode / 2,
        'runtime bytes': diff.runtimeCode,
        'runtime gas':
          runtimeGas === 0
            ? 'Same'
            : `${runtimeGas} gas ${runtimeGasImprovement ? 'less' : 'more'}`,
      }
    })
    if (columnData.length) {
      console.log() // Newline
      console.log(
        columnify(columnData, {
          columns: [
            'name',
            'runtime gas',
            'runtime bytes',
            'initialization bytes',
          ],
          config: {
            name: {
              maxWidth: 30,
              showHeaders: false,
              truncate: true,
            },
            'runtime gas': {
              minWidth: 16,
            },
            'runtime bytes': {
              minWidth: 18,
            },
          },
        })
      )
      console.log() // Newline
    }

    if (warning && (uncomparedOld.length || uncomparedNew.length)) {
      console.warn(
        'Warning: could not compare some contracts that might have been renamed or removed'
      )
      if (uncomparedOld.length) {
        console.warn(`  Missing from ${newDir}: ${uncomparedOld.join(', ')}`)
      }
      if (uncomparedNew.length) {
        console.warn(`  Missing from ${oldDir}: ${uncomparedNew.join(', ')}`)
      }
    }
  } catch (e) {
    errorHandler(e)
  }
}

module.exports = compareHandler
