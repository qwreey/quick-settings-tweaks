// Lerp number
export function lerp(init: number, target: number, ratio: number) {
	return (target - init) * ratio + init
}

// Perform a deep equal operation between too any js value
export function deepEqual(a: any, b: any): boolean {
    if (a == b) return true
    const typeA = typeof a
    if (typeof b != typeA) return false
    if (typeA == "number" && isNaN(a) && isNaN(b)) return true
    if (a instanceof RegExp && b instanceof RegExp) return a.toString() == b.toString()
    if (a instanceof Array && b instanceof Array) {
        const aLength = a.length
        if (aLength != b.length) return false
        if (aLength == 0) return true
        return a.every((value, index) => deepEqual(value, b[index]))
    }
    if (a instanceof Object && b instanceof Object) {
        for (const [key, value] of Object.entries(a)) {
            if (!deepEqual(b[key], value)) return false
        }
        return true
    }
    return false
}
