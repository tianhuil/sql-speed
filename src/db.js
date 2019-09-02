import { Sequelize, STRING, Model } from 'sequelize'

class Employee extends Model {}
class Company extends Model {}

class Database {
  constructor(path, metadata, sequelizeOptions={}) {
    this.path = path
    this.metadata = metadata
    this.sequelize = null
    this.sequelizeOptions = sequelizeOptions
  }

  async initialize() {
    const options = {
      ...this.sequelizeOptions,
      logging: false,
    }

    this.sequelize = new Sequelize(this.path, options)
  }

  async initializeModels() {
    Employee.init({
      name: STRING,
    }, { sequelize: this.sequelize, modelName: 'employee'})
    Company.init({
      name: STRING,
    }, { sequelize: this.sequelize, modelName: 'company'})
    Employee.Company = Employee.belongsTo(Company)
    await Employee.drop()
    await Company.drop()
    await this.sequelize.sync()
    return { Employee, Company }
  }
}

export class Postgres extends Database {
  constructor() {
    super(
      "postgres://pguser:pgpass@localhost:5432/pgdb",
      { db: "postgres", env: "docker" }
    )
  }
}

export class DOPostgres extends Database {
  constructor() {
    super(
      process.env["DO_POSTGRESS_URL"],
      { db: "postgres", env: "do" },
      { 
        dialectOptions: {
          ssl: true
        }
      }
    )
  }
}

export class MySQL extends Database {
  constructor() {
    super(
      "mysql://root:rootpass@localhost:3306/testdb",
      { db: "mysql", env: "docker" }
    )
  }

  async initialize() {
    // hack to create testdb
    const sequelize = new Sequelize("", "root", "rootpass", {
      dialect: "mysql",
      logging: false
    })
    await sequelize.query("CREATE DATABASE IF NOT EXISTS testdb;")

    super.initialize()
  }
}
