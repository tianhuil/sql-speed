import { Sequelize, STRING, INTEGER } from 'sequelize'

async function time(func, obj={}) {
    // const date = new Date()
    const startTime = process.hrtime.bigint()
    const result = await func()
    const endTime = process.hrtime.bigint()
    return {
        ...obj,
        // result,
        duration: (endTime - startTime).toString(),
    }
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

    const results = await Promise.all([...Array(50).keys()].map(
        (i) => time(() => Employee.create({ name: `foo ${i}` }), {name: 'create'})
    ))
    console.log(JSON.stringify(results))

    const employees = await Employee.findAll()
    console.assert(employees.length == 50)
    console.log("Ending Process")
}

main()
