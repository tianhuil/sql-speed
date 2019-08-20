import { Sequelize, STRING } from 'sequelize'

async function time(func, obj={}) {
    const startTime = process.hrtime.bigint()
    const result = await func()
    const endTime = process.hrtime.bigint()
    return {
        ...obj,
        duration: parseInt((endTime - startTime)),
    }
}

async function timeMap(func, n, obj={}, objMap={}) {
    let results = []

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

async function crud(n, sequelize) {
    const Employee = sequelize.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await sequelize.sync()

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

    const employees = await Employee.findAll()
    console.assert(employees.length == n)

    results.push(await timeMap(
        (i) => employees[i].update({ where: { name: `New ${i}` } }),
        n,
        {name: 'update', n},
        {name: 'updateMap', n},
    ))

    results.push(await timeMap(
        (i) => Employee.destroy({ where: { name: `New ${i}` } }),
        n,
        {name: 'delete', n},
        {name: 'deleteMap', n},
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

    const lengths = [10, 100, 1000, 10000]
    const replications = 40
    const ns = [...Array(replications).keys()].flatMap((_) => lengths)

    const results = []
    try {
        for (const n of ns) {
            results.push(await crud(n, sequelize))
        }
    } catch(e) {
        console.log(e)
    }
    
    console.log(JSON.stringify(results.flatMap(x => x)))

    console.warn("Ending Process")
}

main()
