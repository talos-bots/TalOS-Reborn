export type SamplerAlgorithim = "k_lms" | "k_euler" | "k_euler_ancestral" | "k_heun" | "plms" | "ddim" | "nai_smea" | "nai_smea_dyn" | "k_dpmpp_2m" | "k_dpmpp_2s_ancestral" | "k_dpmpp_sde" | "k_dpm_2" | "k_dpm_2_ancestral" | "k_dpm_adaptive" | "k_dpm_fast";
export const samplersArray = ["k_lms", "k_euler", "k_euler_ancestral", "k_heun", "plms", "ddim", "nai_smea", "nai_smea_dyn", "k_dpmpp_2m", "k_dpmpp_2s_ancestral", "k_dpmpp_sde", "k_dpm_2", "k_dpm_2_ancestral", "k_dpm_adaptive", "k_dpm_fast"];

export const NovelAIModels = ['nai-diffusion', 'safe-diffusion', 'nai-diffusion-furry', 'kandinsky-vanilla', 'nai-diffusion-2', 'nai-diffusion-3']

export type AspectRatio = 'square' | 'landscape' | 'portrait';

export type Size = 'large' | 'small' | 'normal' | 'wallpaper';

export type SizePreset = {
    width: number;
    height: number;
    ratio: AspectRatio;
    size: Size;
    serviceName: string;
}

export const sizePresets: SizePreset[] = [
    { width: 832, height: 1216, ratio: 'portrait', size: 'normal', serviceName: 'NovelAI' },
    { width: 1216, height: 832, ratio: 'landscape', size: 'normal', serviceName: 'NovelAI' },
    { width: 1024, height: 1024, ratio: 'square', size: 'normal', serviceName: 'NovelAI' },
    { width: 1920, height: 1088, ratio: 'landscape', size: 'wallpaper', serviceName: 'NovelAI' },
    { width: 1088, height: 1920, ratio: 'portrait', size: 'wallpaper', serviceName: 'NovelAI' },
    { width: 1024, height: 1536, ratio: 'portrait', size: 'large', serviceName: 'NovelAI' },
    { width: 1536, height: 1024, ratio: 'landscape', size: 'large', serviceName: 'NovelAI' },
    { width: 1472, height: 1472, ratio: 'square', size: 'large', serviceName: 'NovelAI' },
    { width: 512, height: 768, ratio: 'portrait', size: 'small', serviceName: 'NovelAI' },
    { width: 768, height: 512, ratio: 'landscape', size: 'small', serviceName: 'NovelAI' },
    { width: 640, height: 640, ratio: 'square', size: 'small', serviceName: 'NovelAI' },
]

export type NovelAIUndesiredContentPreset = {
    value: number;
    name: string;
}

export const novelAIUndesiredContentPresets: NovelAIUndesiredContentPreset[] = [
    {
        value: 0,
        name: 'Heavy',
    },
    {
        value: 1,
        name: 'Light',
    },
    {
        value: 2,
        name: 'Human Focus'
    },
    {
        value: 3,
        name: 'None'
    },
];

export interface NovelAIRequest {
    prompt: string | null, 
    connectionId: string, 
    negative_prompt?: string, 
    height?: number, 
    width?: number, 
    guidance?: number, 
    sampler?: string, 
    steps?: number, 
    number_of_samples?: number,
    seed?: number,
    ucPreset?: number,
    model?: string,
}