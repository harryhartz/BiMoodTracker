import { db } from '../server/db';
import { triggerEvents } from '../shared/schema';
import { format, subDays } from 'date-fns';

async function main() {
  console.log('Adding detailed trigger examples...');

  // First, let's get the user ID
  const testUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, 'test@example.com')
  });

  if (!testUser) {
    console.error('Test user not found. Please run the seed-data.ts script first.');
    process.exit(1);
  }

  const userId = testUser.id;
  console.log(`Found test user with ID: ${userId}`);

  // Define the example triggers
  const triggerExamples = [
    {
      title: 'Sudden Job Loss',
      eventSituation: 'Fired unexpectedly from a job after months of tension with a manager.',
      emotions: ['Shock', 'Worthlessness', 'Fear', 'Abandonment'],
      actionTaken: 'Stopped eating regularly, stayed in bed for 16+ hours a day, ignored calls from family and friends, posted vague depressive content on social media.',
      consequences: [
        'Missed rent payment',
        'Friend withdrew support after being ignored repeatedly', 
        'Increased isolation and paranoia'
      ],
      interventions: [
        'Therapist helped reframe job loss as a trigger rather than a definition of self',
        'Began mood tracking',
        'Reapplied for jobs and practiced setting realistic expectations'
      ],
      startDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
    },
    {
      title: 'Breakup from an Intense Relationship',
      eventSituation: 'Romantic partner ended the relationship after an argument, citing unpredictability and emotional intensity.',
      emotions: ['Grief', 'Shame', 'Rejection', 'Fear'],
      actionTaken: 'Sent dozens of messages trying to "fix" the relationship, stopped medication for a week out of defiance/self-hate, resorted to alcohol to numb the pain.',
      consequences: [
        'Hospitalized after a manic episode triggered by withdrawal',
        'Lost academic scholarship due to missed deadlines'
      ],
      interventions: [
        'Re-established medication routine',
        'Set boundaries in future relationships',
        'Joined a bipolar support group and shared openly for the first time'
      ],
      startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 70), 'yyyy-MM-dd'),
    },
    {
      title: 'Death of a Pet',
      eventSituation: 'Beloved pet died suddenly of illness after 9 years together.',
      emotions: ['Sadness', 'Guilt', 'Despair'],
      actionTaken: 'Isolated from friends who didn\'t "understand" the grief, threw out belongings associated with the pet in an impulsive purge, fantasized about own death.',
      consequences: [
        'Missed medication appointments',
        'Decline in hygiene and eating habits'
      ],
      interventions: [
        'Grief journaling helped express loss constructively',
        'Therapist encouraged reflection on what the pet taught about love and presence',
        'Volunteered briefly at an animal shelter to reconnect with caregiving'
      ],
      startDate: format(subDays(new Date(), 120), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 100), 'yyyy-MM-dd'),
    },
    {
      title: 'Conflict with a Parent',
      eventSituation: 'Parent criticized lifestyle and "lack of ambition," triggering childhood wounds.',
      emotions: ['Anger', 'Shame', 'Hopelessness'],
      actionTaken: 'Blocked family on phone, stopped going to therapy out of anger, started impulsive spending online as a way to "reclaim control".',
      consequences: [
        'Maxed out credit card',
        'Created more shame spiral and self-loathing'
      ],
      interventions: [
        'Budgeting app + small financial goals helped rebuild a sense of control',
        'Wrote unsent letter to parent as part of therapy',
        'Re-engaged with therapist and rebuilt trust slowly'
      ],
      startDate: format(subDays(new Date(), 40), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 25), 'yyyy-MM-dd'),
    },
    {
      title: 'Public Humiliation / Professional Failure',
      eventSituation: 'Presentation at work went poorly; superior ridiculed effort in front of peers.',
      emotions: ['Humiliation', 'Rage', 'Insecurity', 'Self-blame'],
      actionTaken: 'Deleted project files in a fit of despair, quit job the same day without a backup plan, didn\'t tell anyone for 3 weeks.',
      consequences: [
        'Financial instability',
        'Relationship tension due to secret-keeping'
      ],
      interventions: [
        'Started journaling patterns of shame spirals',
        'Coach helped develop a "bounce-back" protocol',
        'Shared the story in group therapy and got validation from others'
      ],
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    }
  ];

  // Add the triggers to the database
  for (const example of triggerExamples) {
    // Calculate duration days
    const start = new Date(example.startDate);
    const end = new Date(example.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Additional detailed notes in JSON format
    const additionalDetails = {
      title: example.title,
      interventions: example.interventions
    };

    // Insert with notes as a properly formatted JSON object
    await db.insert(triggerEvents).values({
      userId,
      eventSituation: example.eventSituation,
      emotions: example.emotions,
      actionTaken: example.actionTaken,
      consequences: example.consequences,
      startDate: example.startDate,
      endDate: example.endDate,
      durationDays,
      remindLater: false,
      notes: additionalDetails as any
    });
  }

  console.log(`Successfully added ${triggerExamples.length} detailed trigger examples`);
}

main()
  .catch((e) => {
    console.error('Error adding trigger examples:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from database...');
    process.exit(0);
  });