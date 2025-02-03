import GdkPixbuf from "gi://GdkPixbuf"
import GLib from "gi://GLib"

const BASE_SIZE = 128
const SKIP_RATE = 4
const MAX_DIST = 255+255+255
const CHANNEL_DIFF_MAX = 255
const CHANNEL_DIFF_MAX_DOUBLE = CHANNEL_DIFF_MAX * CHANNEL_DIFF_MAX
const CHANNEL_DIFF_CUT = 32
const DIV = CHANNEL_DIFF_MAX_DOUBLE * MAX_DIST
const CACHE_INDEXER_Y = BASE_SIZE
const CACHE_SIZE = BASE_SIZE * BASE_SIZE
export function getImageMeanColor(
    image: GdkPixbuf.Pixbuf
): Promise<null|[number,number,number]> {
return new Promise(resolve=>{
    // const id = Math.floor(Math.random()*1000)
    // console.time("getImageMeanColor_"+id)
    const baseImage = image.scale_simple(BASE_SIZE, BASE_SIZE, GdkPixbuf.InterpType.NEAREST)
    const channels = baseImage.n_channels
    if (channels < 3) return null
    const rowstride = baseImage.rowstride
    const pixbuf = baseImage.get_pixels()
    let maxGravity = 0
    let colorR = 0, colorG = 0, colorB = 0
    const channelDiffCaches = new Array(CACHE_SIZE)
    let curY=0, curX=-1
    GLib.idle_add(GLib.PRIORITY_LOW, ()=>{
        // Move current cursor
        curX += SKIP_RATE
        if (curX >= BASE_SIZE) { curX = 0; curY += SKIP_RATE }
        if (curY >= BASE_SIZE) {
            // console.timeEnd("getImageMeanColor_"+id)
            resolve([colorR, colorG, colorB])
            return GLib.SOURCE_REMOVE
        }

        // Get current pixel
        const index = curY * rowstride + curX * channels
        const r = pixbuf[index]
        const g = pixbuf[index+1]
        const b = pixbuf[index+2]

        // Get channel difference of current pixel
        // Note: spidermonkey js engine doesn't have fastapi like v8, so Math.abs much slower
        const cacheIndex1 = curY * CACHE_INDEXER_Y + curX
        let channelDiff1 = channelDiffCaches[cacheIndex1]
        if (channelDiff1 === undefined) {
            const da = r-g, db = r-b, dc = g-b
            channelDiff1 = channelDiffCaches[cacheIndex1] = Math.max(da<0?-da:da, db<0?-db:db, dc<0?-dc:dc)
        }
        if (channelDiff1 <= CHANNEL_DIFF_CUT) return GLib.SOURCE_CONTINUE

        // Get gravity
        let gravity = 0
        for (let x=0; x<BASE_SIZE; x+=SKIP_RATE) {
        for (let y=0; y<BASE_SIZE; y+=SKIP_RATE) {
            const index2 = y * rowstride + x * channels
            if (index == index2) continue
            const r2 = pixbuf[index2]
            const g2 = pixbuf[index2+1]
            const b2 = pixbuf[index2+2]

            // Get channel difference of selected pixel
            const cacheIndex2 = y * CACHE_INDEXER_Y + x
            let channelDiff2 = channelDiffCaches[cacheIndex2]
            if (channelDiff2 === undefined) {
                const da2 = r-g, db2 = r-b, dc2 = g-b
                channelDiff2 = channelDiffCaches[cacheIndex2] = Math.max(da2<0?-da2:da2, db2<0?-db2:db2, dc2<0?-dc2:dc2)
            }
            if (channelDiff2 < CHANNEL_DIFF_CUT) continue

            // Get color difference between two color
            const cda = r-r2, cdb = g-g2, cdc = b-b2
            const colorDiff = (cda<0?-cda:cda) + (cdb<0?-cdb:cdb) + (cdc<0?-cdc:cdc)
            // const colorDiff = Math.abs(r-r2) + Math.abs(g-g2) + Math.abs(b-b2)

            // Calc gravity
            // gravity += (MAX_DIST-colorDiff)/MAX_DIST*channelDiff2*channelDiff1/CHANNEL_DIFF_MAX_DOUBLE
            gravity += (MAX_DIST-colorDiff)*channelDiff2*channelDiff1/DIV
        }}
        if (maxGravity < gravity) {
            maxGravity = gravity
            colorR = r
            colorG = g
            colorB = b
        }
        return GLib.SOURCE_CONTINUE
    })
})}
