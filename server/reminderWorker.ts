import { dbStore } from './storage';
import { sendEmail } from './mailer';
import { Member, FamilyOccasion, RitualReminderCategory } from '../src/types';

// ENV switch for WhatsApp
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === 'true';

export async function runReminderWorker(): Promise<string[]> {
    const logs: string[] = [];
    logs.push('Running reminder worker...');
    
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    const data = dbStore.getData();
    const allOccasions = data.occasions;
    
    const upcomingOccasions = allOccasions.filter(occ => {
        const occDate = new Date(occ.occurrence2027.gregorianDateStr);
        return occDate >= now && occDate <= nextWeek;
    });
    
    const members = data.members;
    
    logs.push(`Processing ${members.length} members against ${upcomingOccasions.length} upcoming occasions.`);
    
    for (const member of members) {
        if (member.status !== 'active') continue;
        
        for (const occ of upcomingOccasions) {
            const prefs = member.reminderPreferences?.categories[occ.occasionType as RitualReminderCategory];
            if (!prefs) continue;

            if (prefs.email && member.email) {
                logs.push(`Sending email to ${member.email} for ${occ.title}`);
                await sendEmail(member.email, `Upcoming: ${occ.title}`, `Reminder: ${occ.title} is coming up soon.`);
            } else {
                logs.push(`Condition not met for ${member.name}: email pref: ${prefs.email}, email: ${member.email}`);
            }
        }
    }
    return logs;
}
