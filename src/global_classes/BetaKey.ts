export type BetaKeyConfig = {
    key: string;
    creator: string;
    created: Date;
    registeredUser: string;
    requests: number;
}

export class BetaKey implements BetaKeyConfig{
    constructor(
        public key: string = generateNewKey(),
        public creator: string = "",
        public created: Date = new Date(),
        public registeredUser: string = "",
        public requests: number = 0,
    ){}
}

function generateNewKey(){
    const key = `wc-${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`;
    return key;
}