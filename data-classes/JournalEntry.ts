class JournalEntry{
    constructor(
        public id: string = new Date().getTime().toString(),
        public authorUid: string,
        public publishDate: Date = new Date(),
        public title: string = '',
        public body: string = '',
        public tags: string[] = [],
        public isPublic: boolean = false,
        public isPublished: boolean = false,
        public isDeleted: boolean = false,
        public isFlagged: boolean = false,
        public flagReason: string = '',
        public flagDate: Date = new Date(),
        public isEditable: boolean = false,
    ){}
}
export default JournalEntry;