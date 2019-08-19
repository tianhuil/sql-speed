import { Sequelize, STRING, INTEGER } from 'sequelize'

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
            (i) => time(func, obj)
        ))
    }, objMap)

    return [
        ...results,
        resultMap
    ]
}

async function createMap(n, Employee) {
    return await timeMap(
        () => Employee.create({ name: `foo` }),
        n,
        {name: 'create', n},
        {name: 'createMap', n},
    )
}

async function main() {
    console.log("Starting Process")
    const path = "postgres://pguser:pgpass@localhost:5432/pgdb"
    const sequelize = new Sequelize(path, {
        operatorsAliases: false,
        logging: true,
    })
    const Employee = sequelize.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await sequelize.sync()

    const lengths = [10, 20]

    const results = await Promise.all(lengths.flatMap(n => createMap(n, Employee)))
    console.log(JSON.stringify(results))


    const employees = await Employee.findAll()
    console.assert(employees.length == lengths.reduce((a, b) => a + b, 0))

    console.log("Ending Process")
}

main()
