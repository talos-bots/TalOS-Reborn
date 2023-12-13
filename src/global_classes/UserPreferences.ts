/* eslint-disable @typescript-eslint/no-explicit-any */
export class UserPreferences {
    private _preferences: any;
    constructor() {
        this._preferences = {};
    }
    get preferences() {
        return this._preferences;
    }
    set preferences(preferences) {
        this._preferences = preferences;
    }
    getPreference(key) {
        return this._preferences[key];
    }
    setPreference(key, value) {
        this._preferences[key] = value;
    }
}