import { Sequelize, STRING } from 'sequelize'

async function define(sequelize) {
    const Employee = sequelize.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await sequelize.sync()
}

async function time(func, obj={}) {
    const startTime = process.hrtime.bigint()
    const result = await func()
    const endTime = process.hrtime.bigint()
    return {
        ...obj,
        duration: (endTime - startTime).toString(),
    }
}

async function timeMap(func, n, obj={}, objMap={}) {
    let results

    const resultMap = await time(async () => {
        results = await Promise.all([...Array(n).keys()].map(
            (i) => time(() => func(i), {i, ...obj})
        ))
    }, objMap)

    return [
        ...results,
        resultMap
    ]
}

async function crud(n, Employee) {
    let results = []
    
    results.push(await timeMap(
        (i) => Employee.create({ name: `${n}:${i}` }),
        n,
        {name: 'create', n},
        {name: 'createMap', n},
    ))

    results.push(await timeMap(
        (i) => Employee.findOne({ where: { name: `${i}` } }),
        n,
        {name: 'read', n},
        {name: 'readMap', n},
    ))

    results.push(await timeMap(
        (i) => Employee.destroy({ where: { name: `${i}` } }),
        n,
        {name: 'delete', n},
        {name: 'deleteMap', n},
    ))

    return results
}

async function timeLog(lengths, func) {
    const results = await Promise.all(lengths.map(func))
    console.log(JSON.stringify(results.flatMap(x => x)))
}

async function assertLength(lengths, Employee) {
    const employees = await Employee.findAll()
    console.assert(employees.length == lengths.reduce((a, b) => a + b, 0))
}

async function main() {
    console.warn("Starting Process")
    const path = "postgres://pguser:pgpass@localhost:5432/pgdb"
    const sequelize = new Sequelize(path, {
        operatorsAliases: false,
        logging: false,
    })

    await define(sequelize)

    const lengths = [10, 100, 1000, 10000]
    await timeLog(lengths, n => crud(n, Employee))
    await assertLength(lengths, Employee)

    console.warn("Ending Process")
}

main()
