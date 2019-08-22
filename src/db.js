import { Sequelize, STRING } from 'sequelize'

export async function initializeModel(db) {
    const Employee = db.define("Employee", {
        name: STRING,
    })
    await Employee.drop()
    await db.sync()
    return Employee
}

function initializeDB(path) {
    const sequelize = new Sequelize(path, {
        operatorsAliases: false,
        logging: false,
    })
    return sequelize
}

export const initializePostgres = async () => initializeDB("postgres://pguser:pgpass@localhost:5432/pgdb")

export const initializeMySQL = async () => {
    // hack to create a DB
    const sequelize = new Sequelize("", "root", "rootpass", {
        dialect: "mysql",
        logging: false
    })
    await sequelize.query("CREATE DATABASE IF NOT EXISTS testdb;")
    return initializeDB("mysql://root:rootpass@localhost:3306/testdb")
}
