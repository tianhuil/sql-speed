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

async function main() {
    console.log("Starting Process")
    const path = "postgres://pguser:pgpass@localhost:5432/pgdb"
    const sequelize = new Sequelize(path, {
        operatorsAliases: false,
        logging: true,
    })
    let Employee = sequelize.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await sequelize.sync()

    const results = await timeMap(
        () => Employee.create({ name: `foo` }),
        20,
        {name: 'create'},
        {name: 'createMap'},
    )
    console.log(JSON.stringify(results))

    const employees = await Employee.findAll()
    console.assert(employees.length == 20)
    console.log("Ending Process")
}

main()
