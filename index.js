import { Sequelize, STRING } from 'sequelize'
import { promisify } from 'util'

async function time(func, obj={}) {
    const startTime = process.hrtime.bigint()
    const result = await func()
    const endTime = process.hrtime.bigint()
    return {
        ...obj,
        duration: parseInt((endTime - startTime)),
    }
}

const sleep = promisify(setTimeout)

async function timeMap(func, queryTimes, obj={}, objMap={}) {
    let results
    
    const resultMap = await time(async () => {
        results = await Promise.all(
            queryTimes.map(
                async (ms, i) => {
                    await sleep(ms)
                    return time(
                        () => func(i),
                        { i, ...obj }
                    )
                }
            )
        )
    }, objMap)

    return [
        ...results,
        resultMap
    ]
}

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

async function crud(qps, duration, sequelize) {
    const Employee = sequelize.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await sequelize.sync()

    let results = []

    const qts = queryTimes(qps, duration)
    
    results.push(...await timeMap(
        (i) => Employee.create({ name: `${qps}:${i}` }),
        qts,
        {name: 'create', qps},
        {name: 'createMap', qps},
    ))

    results.push(...await timeMap(
        (i) => Employee.findOne({ where: { name: `${qps}:${i}` } }),
        qts,
        {name: 'read', qps},
        {name: 'readMap', qps},
    ))

    const employees = await Employee.findAll()
    console.assert(employees.length == qts.length)

    results.push(...await timeMap(
        (i) => employees[i].update({ where: { name: `New ${i}` } }),
        qts,
        {name: 'update', qps},
        {name: 'updateMap', qps},
    ))

    results.push(...await timeMap(
        (i) => Employee.destroy({ where: { name: `New ${i}` } }),
        qts,
        {name: 'delete', qps},
        {name: 'deleteMap', qps},
    ))

    return results
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
            results.push(await crud(qps, duration, sequelize))
        }
    } catch (e) {
        console.log(e)
    }

    console.log(JSON.stringify(results.flatMap(x => x)))

    console.warn("Ending Process")
}

main()
