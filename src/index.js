import { Sequelize, STRING } from 'sequelize'
import { crud } from './timing'

/**
 * Return times to run queries
 * @param {Number} qps          queries per second
 * @param {Number} duration     duration in seconds
 * @return {Array[Number]}      array of run times in milliseconds
 */
function queryTimes(qps, duration) {
    const unit = 1000 / qps
    const length = Math.ceil(1000 * duration / unit)
    return [...Array(length).keys()].map(i => i * unit)
}

async function initializeModel(sequelize) {
    const Employee = sequelize.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await sequelize.sync()
    return Employee
}

async function main() {
    console.warn("Starting Process")
    const path = "postgres://pguser:pgpass@localhost:5432/pgdb"
    const sequelize = new Sequelize(path, {
        operatorsAliases: false,
        logging: false,
    })

    const duration = Number(process.argv[2])
    const qpz = process.argv[3].split(',').map(Number)
    const results = []

    try {
        for (const qps of qpz) {
            const Employee = await initializeModel(sequelize)
            results.push(await crud(queryTimes(qps, duration), qps, Employee))
        }
    } catch (e) {
        console.log(e)
    }

    console.log(JSON.stringify(results.flatMap(x => x)))

    console.warn("Ending Process")
}

main()
