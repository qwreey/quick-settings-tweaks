import Gio from "gi://Gio";
import { Maid } from "./maid.js";

export class SettingLoader {
    settings: Gio.Settings
    records: Set<string>
    listeners: number[]
    onChange: (key: string)=>void
    constructor(
        settings: Gio.Settings,
        onChange: SettingLoader['onChange']
    ) {
        this.settings = settings
        this.records = new Set()
        this.listeners = []
        this.onChange = onChange
    }

    private push(key: string) {
        if (this.records.has(key)) return
        this.records.add(key)
        this.listeners.push(
            this.settings.connect(
                `changed::${key}`,
                () => this.onChange(key)
            )
        )
    }
    clear() {
        for (const source of this.listeners) {
            this.settings.disconnect(source)
        }
        this.listeners = []
        this.records.clear()
    }

    loadBoolean(key: string): boolean {
        this.push(key)
        return this.settings.get_boolean(key)
    }
    loadString(key: string): string {
        this.push(key)
        return this.settings.get_string(key)
    }
    loadInt(key: string): number {
        this.push(key)
        return this.settings.get_int(key)
    }
}

export abstract class FeatureBase {
    loader: SettingLoader
    settings: Gio.Settings
    maid: Maid

    constructor(settings: Gio.Settings) {
        this.maid = new Maid()
        this.settings = settings
        this.loader = new SettingLoader(settings, (key: string)=>{
            this.loader.clear()
            this.loadSettings(this.loader)
            this.reload(key)
        })
        this.loadSettings(this.loader)
    }

    load() {
        this.onLoad()
    }
    unload() {
        this.loader.clear()
        this.onUnload()
        this.maid.clear()
    }
    onLoad() {}
    onUnload() {}
    hotReload() {
        this.unload()
        this.load()
    }
    reload(changedKey?: string) {
        this.hotReload()
    }
    loadSettings(loader: SettingLoader) {}
}
