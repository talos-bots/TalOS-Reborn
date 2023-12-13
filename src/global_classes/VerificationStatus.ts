/* eslint-disable @typescript-eslint/no-explicit-any */
export type ApprovalStatus = 'approved' | 'declined' | 'pending';

export class VerificationInformation{
    constructor(
        public status: ApprovalStatus = 'pending',
        public verification_date: Date | null = null,
        public verification_users: string[] = [],
        public verification_notes: string[] = [],
        public submission_date: Date | null = null,
        public submission_user: string = '',
    ){}

    addVerificationUser(user: string){
        this.verification_users.push(user);
    }

    removeVerificationUser(user: string){
        this.verification_users = this.verification_users.filter(u => u !== user);
    }

    addVerificationNote(note: string){
        this.verification_notes.push(note);
    }

    removeVerificationNoteAt(index: number){
        this.verification_notes.splice(index, 1);
    }

    removeVerificationNoteByContent(note: string){
        this.verification_notes = this.verification_notes.filter(n => n !== note);
    }

    setVerificationDate(date: Date){
        this.verification_date = date;
    }

    setSubmissionDate(date: Date){
        this.submission_date = date;
    }

    setSubmissionUser(user: string){
        this.submission_user = user;
    }

    setStatus(status: ApprovalStatus){
        this.status = status;
    }

    toJSON(): any {
        return {
            status: this.status,
            verification_date: this.verification_date,
            verification_users: this.verification_users,
            verification_notes: this.verification_notes,
            submission_date: this.submission_date,
            submission_user: this.submission_user,
        };
    }
}