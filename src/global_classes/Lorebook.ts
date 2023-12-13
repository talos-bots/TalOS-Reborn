/* eslint-disable @typescript-eslint/no-explicit-any */
export class Lorebook {
    constructor(
        public _id: string = (new Date().getTime()).toString(),
        public name: string = 'New Lorebook Entry',
        public description: string = '',
        public scan_depth: number = 0,
        public token_budget: number = 0,
        public recursive_scanning: boolean = false,
        public extensions: Record<string, any> = {},
        public entries: LoreEntry[] = [],
        public characters: string[] = [],
        public global: boolean = false,
    ) {}

    addEntry(entry: LoreEntry){
        this.entries.push(entry);
    }

    removeEntry(entry: LoreEntry){
        this.entries.splice(this.entries.indexOf(entry), 1);
    }

    getEntryById(id: string){
        return this.entries.find((entry) => entry._id === id);
    }

    getEntryByIndex(index: number){
        return this.entries[index];
    }

    getEntryIndex(entry: LoreEntry){
        return this.entries.indexOf(entry);
    }

    setEntryIndex(entry: LoreEntry, index: number){
        this.entries.splice(this.entries.indexOf(entry), 1);
        this.entries.splice(index, 0, entry);
    }

    moveEntryUp(entry: LoreEntry){
        const index = this.entries.indexOf(entry);
        if(index > 0){
            this.setEntryIndex(entry, index - 1);
        }
    }

    moveEntryDown(entry: LoreEntry){
        const index = this.entries.indexOf(entry);
        if(index < this.entries.length - 1){
            this.setEntryIndex(entry, index + 1);
        }
    }

    moveEntryToTop(entry: LoreEntry){
        this.setEntryIndex(entry, 0);
    }

    moveEntryToBottom(entry: LoreEntry){
        this.setEntryIndex(entry, this.entries.length - 1);
    }

    toJSON(): any {
        return {
            _id: this._id,
            name: this.name,
            description: this.description,
            scan_depth: this.scan_depth,
            token_budget: this.token_budget,
            recursive_scanning: this.recursive_scanning,
            extensions: this.extensions,
            entries: this.entries.map((entry) => entry.toJSON()),
            characters: this.characters,
            global: this.global,
        };
    }
}

export type EntryPostion = 'before_char' | 'after_char';

export class LoreEntry {
    constructor(
        public _id: string = (new Date().getTime()).toString(),
        public keys: string[] = [],
        public content: string = '',
        public extensions: Record<string, any> = {},
        public enabled: boolean = true,
        public case_sensitive: boolean = false,
        public insertion_order: number = 0,
        public name: string = '',
        public priority: number = 0,
        public comment: string = '',
        public selective: boolean = false,
        public secondary_keys: string[] = [],
        public constant: boolean = false,
        public position: EntryPostion = 'before_char',
    ) {}

    addKey(key: string) {
        this.keys.push(key);
    }

    removeKey(key: string) {
        this.keys.splice(this.keys.indexOf(key), 1);
    }

    addSecondaryKey(key: string) {
        this.secondary_keys.push(key);
    }

    removeSecondaryKey(key: string) {
        this.secondary_keys.splice(this.secondary_keys.indexOf(key), 1);
    }

    toJSON(): any {
        return {
            _id: this._id,
            keys: this.keys,
            content: this.content,
            extensions: this.extensions,
            enabled: this.enabled,
            case_sensitive: this.case_sensitive,
            insertion_order: this.insertion_order,
            name: this.name,
            priority: this.priority,
            comment: this.comment,
            selective: this.selective,
            secondary_keys: this.secondary_keys,
            constant: this.constant,
            position: this.position,
        };
    }
}