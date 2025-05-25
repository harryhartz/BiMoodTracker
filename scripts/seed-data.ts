import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { 
  users, moodEntries, triggerEvents, thoughts, medications 
} from '../shared/schema';
import { format, subDays } from 'date-fns';

async function main() {
  console.log('Starting to seed database...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  console.log('Creating test user...');
  const [user] = await db
    .insert(users)
    .values({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
    })
    .returning();
  
  console.log(`Created test user with ID: ${user.id}`);

  // Create 30 days of mood entries (both morning and evening)
  console.log('Creating mood entries...');
  
  const moods = ['Happy', 'Calm', 'Sad', 'Anxious', 'Irritable', 'Energetic', 'Tired', 'Content'];
  const cravingsTags = ['Sugar', 'Caffeine', 'Alcohol', 'Social Media', 'Shopping', 'Fast Food'];
  
  for (let i = 0; i < 30; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    // Morning entry
    await db.insert(moodEntries).values({
      userId: user.id,
      date,
      timeOfDay: 'morning',
      mood: moods[Math.floor(Math.random() * moods.length)],
      overallMoodIntensity: Math.floor(Math.random() * 5) - 2, // -2 to +2
      hoursSlept: Math.floor(Math.random() * 4) + 5, // 5-9 hours
      weight: Math.floor(Math.random() * 10) + 70, // 70-80
      weightUnit: 'kg',
      morningMedication: Math.random() > 0.3, // 70% took medication
      reflectiveComment: `Morning reflection for ${date}. Feeling ${Math.random() > 0.5 ? 'okay' : 'a bit off'} today.`,
      cravingsImpulses: Math.random() > 0.7,
      cravingsTags: Math.random() > 0.7 ? [cravingsTags[Math.floor(Math.random() * cravingsTags.length)]] : [],
    });
    
    // Evening entry
    await db.insert(moodEntries).values({
      userId: user.id,
      date,
      timeOfDay: 'evening',
      mood: moods[Math.floor(Math.random() * moods.length)],
      overallMoodIntensity: Math.floor(Math.random() * 5) - 2, // -2 to +2
      sleepQuality: Math.floor(Math.random() * 5), // 0-4
      eveningMedication: Math.random() > 0.3, // 70% took medication
      energyLevel: Math.floor(Math.random() * 5), // 0-4
      overallDaySummary: `Overall summary for ${date}. The day was ${Math.random() > 0.5 ? 'productive' : 'challenging'}.`,
      cravingsImpulses: Math.random() > 0.7,
      cravingsTags: Math.random() > 0.7 ? [cravingsTags[Math.floor(Math.random() * cravingsTags.length)]] : [],
    });
  }
  
  console.log(`Created ${30 * 2} mood entries`);

  // Create trigger events
  console.log('Creating trigger events...');
  
  const situations = [
    'Work stress', 
    'Argument with friend', 
    'Financial pressure', 
    'Family gathering', 
    'Public speaking', 
    'Difficult conversation'
  ];
  
  const emotions = [
    'Anxiety', 'Sadness', 'Anger', 'Fear', 'Shame', 'Guilt', 
    'Joy', 'Excitement', 'Pride', 'Relief', 'Frustration'
  ];
  
  const actions = [
    'Deep breathing', 
    'Walked away', 
    'Called a friend', 
    'Journaled', 
    'Meditation', 
    'Exercise',
    'Unhealthy coping'
  ];
  
  const consequences = [
    'Felt calmer', 
    'Situation improved', 
    'Relationship strengthened', 
    'Gained insight', 
    'Problem solved',
    'Made things worse',
    'Regretted my response'
  ];
  
  for (let i = 0; i < 12; i++) {
    const startDate = format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd');
    const endDate = Math.random() > 0.3 
      ? format(subDays(new Date(), Math.floor(Math.random() * 15)), 'yyyy-MM-dd') 
      : null; // 30% ongoing
    
    const randomEmotions = Array.from(
      { length: Math.floor(Math.random() * 3) + 1 }, 
      () => emotions[Math.floor(Math.random() * emotions.length)]
    );
    
    const randomConsequences = Array.from(
      { length: Math.floor(Math.random() * 2) + 1 },
      () => consequences[Math.floor(Math.random() * consequences.length)]
    );
    
    await db.insert(triggerEvents).values({
      userId: user.id,
      eventSituation: situations[Math.floor(Math.random() * situations.length)],
      emotions: randomEmotions,
      actionTaken: actions[Math.floor(Math.random() * actions.length)],
      consequences: randomConsequences,
      startDate,
      endDate,
      remindLater: Math.random() > 0.8, // 20% reminder
    });
  }
  
  console.log(`Created 12 trigger events`);

  // Create thoughts
  console.log('Creating thoughts...');
  
  const thoughtContents = [
    'I noticed I feel better when I start my day with exercise',
    'Need to remember to take time for myself when work gets stressful',
    'The new meditation technique is helping with my anxiety',
    'I should talk to my doctor about adjusting my medication',
    'Today I recognized my negative thought pattern and was able to reframe it',
    'Journaling before bed seems to help me sleep better',
    'I want to work on being more assertive in difficult conversations',
    'I\'ve noticed a connection between my diet and mood swings',
    'The support group was really helpful today',
    'I need to be more mindful about my screen time before bed'
  ];
  
  const moodTags = ['Reflective', 'Hopeful', 'Worried', 'Determined', 'Grateful', 'Curious'];
  
  for (let i = 0; i < 15; i++) {
    const randomTags = Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      () => moodTags[Math.floor(Math.random() * moodTags.length)]
    );
    
    await db.insert(thoughts).values({
      userId: user.id,
      content: thoughtContents[Math.floor(Math.random() * thoughtContents.length)],
      moodTags: randomTags,
    });
  }
  
  console.log(`Created 15 thoughts`);

  // Create medications
  console.log('Creating medications...');
  
  const medicationData = [
    { name: 'Sertraline', dosage: '50mg', schedule: 'Daily in the morning' },
    { name: 'Lorazepam', dosage: '0.5mg', schedule: 'As needed for anxiety' },
    { name: 'Melatonin', dosage: '3mg', schedule: 'Before bed as needed' },
    { name: 'Vitamin D', dosage: '2000 IU', schedule: 'Daily with breakfast' }
  ];
  
  for (const med of medicationData) {
    await db.insert(medications).values({
      userId: user.id,
      name: med.name,
      dosage: med.dosage,
      schedule: med.schedule,
    });
  }
  
  console.log(`Created ${medicationData.length} medications`);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting from database...');
    process.exit(0);
  });