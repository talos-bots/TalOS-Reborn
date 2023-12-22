import { SettingsInterface } from "../routes/connections.js";

export const DefaultSettings: SettingsInterface[] = [
    {
        "id": "1",
        "name": "Sen's Coherrent 8k Vicuna",
        "context_length": 8096,
        "max_tokens": 250,
        "min_tokens": 0,
        "temperature": 0.83,
        "rep_pen": 1.1,
        "rep_pen_range": 4096,
        "rep_pen_slope": 0.9,
        "frequency_penalty": 0.8,
        "presence_penalty": 0.6,
        "min_p": 0.6,
        "top_a": 0,
        "top_k": 40,
        "top_p": 0.9,
        "typical": 1,
        "tfs": 1,
        "sampler_order": [
            6,
            3,
            2,
            5,
            0,
            1,
            4
        ],
        "sampler_full_determinism": true,
        "singleline": false,
        "mirostat_eta": 0,
        "mirostat_mode": 0,
        "mirostat_tau": 0,
        "instruct_mode": "Vicuna"
    },
]