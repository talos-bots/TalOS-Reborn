import { BetaKey } from "./CompletionRequest.js";

export class UserInfo {
    constructor(
        public uid: string,
        public displayName: string,
        public photoURL: string,
        public email: string | null,
        public emailVerified: boolean | null = false,
        public isAdministrator: boolean = false,
        public isModerator: boolean = false,
        public isTester: boolean = false,
        public infractions: number = 0,
        public lastLogin: Date = new Date(),
        public dateCreated: Date = new Date(),
        public betaKeys: string[] = [],
    ){}

    public static fromFirebaseUser(user: any) {
        return new UserInfo(
            user.uid,
            user.displayName,
            user.photoURL,
            user.email,
            user.emailVerified,
            false,
            false,
            false,
            0,
            new Date(),
            new Date(),
            [],
        );
    }
}