import { Sequelize, STRING } from 'sequelize'

class Database {
    constructor(path, metadata) {
        this.path = path
        this.metadata = metadata
        this.sequelize = null
    }

    async initialize() {
        this.sequelize = new Sequelize(this.path, {
            operatorsAliases: false,
            logging: false,
        })
    }

    async initializeModels() {
        const Employee = this.sequelize.define("Employee", {
            name: STRING,
        })
        const Company = this.sequelize.define("Company", {
            name: STRING,
        })
        Employee.belongsTo(Company)
        await Employee.drop()
        await Company.drop()
        await this.sequelize.sync()
        return { Employee, Company }
    }
}

export class Postgres extends Database {
    constructor() {
        super("postgres://pguser:pgpass@localhost:5432/pgdb", { db: "postgres", env: "docker" })
    }
}

export class MySQL extends Database {
    constructor() {
        super("mysql://root:rootpass@localhost:3306/testdb", { db: "mysql", env: "docker" })
    }

    async initialize() {
        // hack to create a DB
        const sequelize = new Sequelize("", "root", "rootpass", {
            dialect: "mysql",
            logging: false
        })
        await sequelize.query("CREATE DATABASE IF NOT EXISTS testdb;")

        super.initialize()
    }
}
