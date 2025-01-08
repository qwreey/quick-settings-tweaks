// Connection destroyer
class Maid {
	private records: [Maid.TaskType, number, ...any][]

	constructor() {
		this.records = []
	}

	connectJob(
        signalObject: any,
        signalName: string,
        handleFunc: (...args: any)=>any,
        priority: number = 0
    ) {
		this.getRecords().push([Maid.TaskType.Connect, priority, signalObject, signalObject.connect(signalName, handleFunc)])
	}

	functionJob(func: (...args: any)=>any, priority: number = 0) {
		this.getRecords().push([Maid.TaskType.Function, priority, func])
	}

	disposeJob(object: any, priority: number = 0) {
		this.getRecords().push([Maid.TaskType.Dispose, priority, object])
	}

	runDisposeJob(object: any, priority: number = 0) {
		this.getRecords().push([Maid.TaskType.RunDispose, priority, object])
	}

	destroyJob(object: any, priority: number = 0) {
		this.getRecords().push([Maid.TaskType.Destroy, priority, object])
	}

	destroy() {
		this.clear()
		this.records = null
	}

	getRecords(): Maid['records'] {
		if (!this.records) Error("Maid object already destroyed")
		return this.records
	}

	patchJob(
        patchObject: any,
        patchName: string,
        handleFunc: (...args: any)=>any,
        priority: number = 0
    ) {
        const original = patchObject[patchName]
		this.getRecords().push([Maid.TaskType.Patch, priority, patchObject, patchName, original])
		patchObject[patchName] = handleFunc(original)
	}

	clear() {
		const records = this.getRecords()
		records.sort((a, b) => b[1] - a[1])
		for (const record of records) {
			switch (record[0]) {
				case Maid.TaskType.Connect:
					record[2].disconnect(record[3])
					break
				case Maid.TaskType.Function:
					record[2]()
					break
				case Maid.TaskType.Dispose:
					record[2].dispose()
					break
				case Maid.TaskType.RunDispose:
					record[2].run_dispose()
					break
				case Maid.TaskType.Destroy:
					record[2].destroy()
					break
				case Maid.TaskType.Patch:
					record[2][record[1]] = record[2]
					break
				default:
					throw Error("Unknown task type.")
			}
		}
		this.records = []
	}
}
namespace Maid {
	export enum TaskType {
		Connect,
		Function,
		Dispose,
		RunDispose,
		Destroy,
		Patch,
	}
	export const Priority = {
		High: 2000,
		Default: 0,
		Low: -2000,
	}
}
export default Maid
