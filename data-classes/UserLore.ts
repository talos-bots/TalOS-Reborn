class UserLore {
    constructor(
        public uid: string,
        public displayName: string = '',
        public firstName: string = '',
        public lastName: string = '',
        public middleName: string = '',
        public backgroundURL: string = '',
        public grade: number = 0,
        public wordsSent: number = 0,
        public averageDailyWords: number = 0,
        public kudosReceived: number = 0,
        public kudosGiven: number = 0,
        public totalKudosGenerated: number = 0,
        public messagesSent: number = 0,
        public messagesReceived: number = 0,
        public eventsAttended: number = 0,
        public eventsHosted: number = 0,
        public level: number = 0,
        public journalEntries: number = 0,
        public tagline: string = '',
        public description: string = '',
        public personality: string = '',
        public tags: string[] = [],
        public creator_notes: string = '',
    ){}
}
export default UserLore;