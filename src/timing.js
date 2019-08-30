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
                        { ms, i, ...obj }
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

export async function crud(queryTimes, metadata, db) {
    const { Employee } = await db.initializeModels()

    let results = []
    
    results.push(...await timeMap(
        (i) => Employee.create({ name: `${i}` }),
        queryTimes,
        {...metadata, action: 'create'},
        {...metadata, action: 'createMap'},
    ))

    console.assert((await Employee.findAll()).length == queryTimes.length)

    results.push(...await timeMap(
        async (i) => {
            const employee = await Employee.findOne({ where: { name: `${i}` } })
            console.assert(employee.id)
        },
        queryTimes,
        {...metadata, action: 'read'},
        {...metadata, action: 'readMap'},
    ))

    results.push(...await timeMap(
        (i) => Employee.update(
            { name: `New ${i}` },
            { where: { name: `${i}` } },
        ),
        queryTimes,
        {...metadata, action: 'update'},
        {...metadata, action: 'updateMap'},
    ))

    results.push(...await timeMap(
        (i) => Employee.destroy({ where: { name: `New ${i}` } }),
        queryTimes,
        {...metadata, action: 'delete'},
        {...metadata, action: 'deleteMap'},
    ))

    console.assert((await Employee.findAll()).length == 0)
    return results
}

export async function crud2(queryTimes, metadata, db) {
    const { Employee, Company } = await db.initializeModels()

    let results = []

    results.push(...await timeMap(
        (i) => Employee.create({
            name: `${i}`,
            company: { name: `${i}`}
        }, {
            include: [{
                association: Employee.Company,
            }]
        }),
        queryTimes,
        {...metadata, action: 'create2'},
        {...metadata, action: 'create2Map'},
    ))

    console.assert((await Employee.findAll()).length == queryTimes.length)
    console.assert((await Company.findAll()).length == queryTimes.length)

    results.push(...await timeMap(
        async (i) => {
            const employee = await Employee.findOne({
                where: { name: `${i}` },
                include: [{
                    model: Company
                }]
            })
            console.assert(employee.id)
            console.assert(employee.company.id)
        },
        queryTimes,
        {...metadata, action: 'read2a'},
        {...metadata, action: 'read2aMap'},
    ))

    results.push(...await timeMap(
        async (i) => {
            const employee = await Employee.findOne({
                include: [{
                    model: Company,
                    where: { name: `${i}` }
                }]
            })
            console.assert(employee.id)
            console.assert(employee.company.id)
        },
        queryTimes,
        {...metadata, action: 'read2b'},
        {...metadata, action: 'read2bMap'},
    ))

    return results
}
