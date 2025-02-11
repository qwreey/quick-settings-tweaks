export class StyleClass {
	classArray: string[]
	modified: boolean
	constructor(classString: string) {
		this.modified = false
		this.classArray = classString.split(" ")
	}
	remove(className: string): StyleClass {
		const lastLen = this.classArray.length
		this.classArray = this.classArray.filter(
			i => i != className
		)
		if (this.classArray.length != lastLen) {
			this.modified = true
		}
		return this
	}
	add(className: string): StyleClass {
		if (this.classArray.includes(className)) return this
		this.classArray.push(className)
		this.modified = true
		return this
	}
	stringify(): string {
		return this.classArray.join(" ")
	}
}
