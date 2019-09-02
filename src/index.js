import 'core-js/stable'
import 'regenerator-runtime/runtime'

require('dotenv').config()

import { crud } from './timing'
import { Postgres, MySQL, DOPostgres } from './db'


/**
 * Return times to run queries
 * @param {Number} qps        queries per second
 * @param {Number} duration   duration in seconds
 * @return {Array[Number]}    array of run times in milliseconds
 */
function queryTimes(qps, duration) {
  const unit = 1000 / qps
  const length = Math.ceil(1000 * duration / unit)
  return [...Array(length).keys()].map(i => i * unit)
}

async function main() {
  console.warn("Starting Process")

  const duration = Number(process.argv[2])
  const qpz = process.argv[3].split(',').map(Number)
  const results = []

  const dbs = [new DOPostgres(), new MySQL(), new Postgres()]
  await Promise.all(dbs.map(db => db.initialize()))

  for (const qps of qpz) {
    for (const db of dbs) {
      const metadata = { ...db.metadata, qps }
      try {
        results.push(await crud(queryTimes(qps, duration), metadata, db))
      } catch (e) {
        console.warn("Encountered Error on iteration", metadata)
        console.warn(e)
      }
    }
  }

  console.log(JSON.stringify(results.flatMap(x => x)))

  console.warn("Ending Process")
}

main()
