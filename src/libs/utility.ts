export function lerp(init: number, target: number, ratio: number) {
    return (target - init) * ratio + init
}
