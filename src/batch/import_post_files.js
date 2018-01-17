import fs from 'fs-extra'
import path from 'path'
import util from 'util' // eslint-disable-line no-unused-vars

import _debug from 'debug'
_debug.enable('*')

const debug = _debug('hotohoto')

const IS_DRY_RUN = false // keep original files

const inDir = path.join(__dirname, '../_posts')
// Here we go.

if (!fs.existsSync(inDir) || !fs.statSync(inDir).isDirectory()) {
  debug('Path to posts does not exist or it is not a directory.', inDir)
} else {
  fs.readdir(inDir, (err, files) => {
    if (err) {
      debug(err)
      return
    }

    files.forEach(file => {
      const [,,, ..._name] = file.split('-')
      const [name] = _name.join('-').split('.')
      const inPath = path.join(inDir, file)

      if (fs.statSync(inPath).isDirectory()) {
        debug('[SKIP]', file)
        return
      }

      const outDir = path.join(inDir, 'out', name)
      const outPath = path.join(outDir, 'index.md')

      let content = String(fs.readFileSync(inPath))
      // (http://hotohoto82.cafe24.com/wp-content/uploads/1/cfile1.uf.25512C5052C4274E1E9090.jpg)
      const assetRules = [
        {
          regex: /\(http:\/\/hotohoto82\.cafe24\.com\/wp-content\/uploads\/1\/([ㄱ-ㅎ가-힣a-zA-Z0-9_. ]+)\)/g,
          replacementRegex: filename => `http://hotohoto82.cafe24.com/wp-content/uploads/1/${filename})`,
          idx: 1,
          inDir: path.join(__dirname, '../_posts/_assets/wp')
        },
        {
          regex: /\(\/assets\/2017\/([ㄱ-ㅎ가-힣a-zA-Z0-9_. ]+)\)/g,
          replacementRegex: filename => `(/assets/2017/${filename})`,
          idx: 1,
          inDir: path.join(__dirname, '../_posts/_assets/2017')
        },
        {
          regex: /\(\/assets\/2018\/([ㄱ-ㅎ가-힣a-zA-Z0-9_. ]+)\)/g,
          replacementRegex: filename => `(/assets/2018/${filename})`,
          idx: 1,
          inDir: path.join(__dirname, '../_posts/_assets/2018')
        }
      ]
      const assetMatches = []
      assetRules.map(x => {
        let matches
        while ((matches = x.regex.exec(content)) !== null) {
          debug(matches)
          const f = matches[1]
          assetMatches.push({
            inPath: path.join(x.inDir, f),
            outPath: path.join(outDir, f),
            filename: f,
            regex: x.regex,
            replacementRegex: x.replacementRegex
          })
        }
      })

      if (IS_DRY_RUN) {
        // debug(inPath)
        // debug(outPath)
        // debug(assetMatches)
      } else {
        fs.ensureDirSync(outDir)
        assetMatches.map(x => {
          fs.copySync(x.inPath, x.outPath)
          content = content.replace(x.replacementRegex(x.filename), `(./${x.filename})`)
        })
        fs.writeFileSync(outPath, content)
      }
    })
  })
}
