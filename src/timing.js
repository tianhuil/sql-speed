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

export async function crud(queryTimes, metadata, Employee) {
    let results = []
    
    results.push(...await timeMap(
        (i) => Employee.create({ name: `${i}` }),
        queryTimes,
        {...metadata, name: 'create'},
        {...metadata, name: 'createMap'},
    ))

    results.push(...await timeMap(
        async (i) => {
            const employee = await Employee.findOne({ where: { name: `${i}` } })
            console.assert(employee.id)
        },
        queryTimes,
        {...metadata, name: 'read'},
        {...metadata, name: 'readMap'},
    ))

    const employees = await Employee.findAll()
    console.assert(employees.length == queryTimes.length)

    results.push(...await timeMap(
        (i) => employees[i].update({ where: { name: `New ${i}` } }),
        queryTimes,
        {...metadata, name: 'update'},
        {...metadata, name: 'updateMap'},
    ))

    results.push(...await timeMap(
        (i) => Employee.destroy({ where: { name: `New ${i}` } }),
        queryTimes,
        {...metadata, name: 'delete'},
        {...metadata, name: 'deleteMap'},
    ))

    return results
}
