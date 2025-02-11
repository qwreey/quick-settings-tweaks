export type Rgba = [number, number, number, number]
export namespace Rgba {
    export function formatCss(color: Rgba): string {
        const [r,g,b,a] = color
        return `rgba(${r},${g},${b},${a/1000})`
    }
}
export type Rgb = [number, number, number]
