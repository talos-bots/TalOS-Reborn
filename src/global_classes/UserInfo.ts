import { UserPersona } from "./Character";
/* eslint-disable @typescript-eslint/no-explicit-any */
export class UserInfo {
    defaultPersona: UserPersona | null = null;
    constructor(
        public uid: string,
        public isAdministrator: boolean = false,
        public isModerator: boolean = false,
        public isTester: boolean = false,
        public infractions: number = 0,
        public lastLogin: Date = new Date(),
        public dateCreated: Date = new Date(),
    ){}
        
    public static fromFirebaseUser(user: any) {
        return new UserInfo(
            user.uid,
            false,
            false,
            false,
            0,
            new Date(),
            new Date()
        );
    }

    toJSON(): any {
        return {
            uid: this.uid,
            isAdministrator: this.isAdministrator,
            isModerator: this.isModerator,
            isTester: this.isTester,
            infractions: this.infractions,
            lastLogin: this.lastLogin,
            dateCreated: this.dateCreated,
            defaultPersona: this.defaultPersona?.toJSON() || null
        };
    }
}