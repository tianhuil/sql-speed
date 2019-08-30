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
    const Model = await db.initializeModel()

    let results = []
    
    results.push(...await timeMap(
        (i) => Model.create({ name: `${i}` }),
        queryTimes,
        {...metadata, action: 'create'},
        {...metadata, action: 'createMap'},
    ))

    results.push(...await timeMap(
        async (i) => {
            const employee = await Model.findOne({ where: { name: `${i}` } })
            console.assert(employee.id)
        },
        queryTimes,
        {...metadata, action: 'read'},
        {...metadata, action: 'readMap'},
    ))

    console.assert((await Model.findAll()).length == queryTimes.length)

    results.push(...await timeMap(
        (i) => Model.update(
            { name: `New ${i}` },
            { where: { name: `${i}` } },
        ),
        queryTimes,
        {...metadata, action: 'update'},
        {...metadata, action: 'updateMap'},
    ))

    results.push(...await timeMap(
        (i) => Model.destroy({ where: { name: `New ${i}` } }),
        queryTimes,
        {...metadata, action: 'delete'},
        {...metadata, action: 'deleteMap'},
    ))

    console.assert((await Model.findAll()).length == 0)

    return results
}
