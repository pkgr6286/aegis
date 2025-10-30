#!/usr/bin/env tsx
/**
 * Comprehensive Seed Script: Realistic Pharmaceutical Data
 * 
 * Creates 10 major pharma tenants with realistic drug programs and complete questionnaires
 * Run with: npx tsx server/scripts/seed-comprehensive.ts
 */

import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db } from '../src/db';
import { 
  users, 
  tenants,
} from '../src/db/schema/public';
import { 
  tenantUsers,
} from '../src/db/schema/core';
import {
  brandConfigs,
  drugPrograms,
  screenerVersions,
} from '../src/db/schema/programs';
import {
  partners,
  partnerApiKeys,
  partnerConfigs,
} from '../src/db/schema/partners';
import {
  screeningSessions,
  verificationCodes,
} from '../src/db/schema/consumer';
import {
  auditLogs,
} from '../src/db/schema/core';
import { eq } from 'drizzle-orm';
import type { ScreenerJSON } from '../../client/src/types/screener';

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Helper to create realistic full names
function createFullName() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  };
}

// Helper to generate visual flow nodes and edges from questions and logic
function generateFlowNodesAndEdges(screenerJson: ScreenerJSON): { nodes: any[]; edges: any[] } {
  const nodes: any[] = [];
  const edges: any[] = [];
  
  // Start node
  nodes.push({
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: 'Start' },
  });

  // Question nodes
  let yPos = 200;
  screenerJson.questions.forEach((question, index) => {
    const nodeId = `question-${question.id}`;
    nodes.push({
      id: nodeId,
      type: 'question',
      position: { x: 250, y: yPos },
      data: {
        label: `Question ${index + 1}`,
        questionId: question.id,
        questionType: question.type,
        questionText: question.text,
        required: question.required,
        options: question.options,
        validation: question.validation,
      },
    });
    
    // Connect start to first question, or previous question to current
    if (index === 0) {
      edges.push({
        id: `start-to-${question.id}`,
        source: 'start-1',
        target: nodeId,
      });
    } else {
      edges.push({
        id: `${screenerJson.questions[index - 1].id}-to-${question.id}`,
        source: `question-${screenerJson.questions[index - 1].id}`,
        target: nodeId,
      });
    }
    
    yPos += 180;
  });

  // Outcome nodes (create unique outcomes from logic rules)
  const outcomes = new Set<string>();
  screenerJson.logic.rules.forEach(rule => outcomes.add(rule.outcome));
  outcomes.add(screenerJson.logic.defaultOutcome);

  const outcomeArray = Array.from(outcomes);
  const outcomeSpacing = 300;
  const outcomeStartX = 100;
  
  outcomeArray.forEach((outcome, index) => {
    const nodeId = `outcome-${outcome}`;
    const rule = screenerJson.logic.rules.find(r => r.outcome === outcome);
    nodes.push({
      id: nodeId,
      type: 'outcome',
      position: { x: outcomeStartX + (index * outcomeSpacing), y: yPos + 100 },
      data: {
        label: outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        outcome,
        message: rule?.message || (outcome === screenerJson.logic.defaultOutcome ? 'Based on your answers, you may use this product.' : ''),
      },
    });

    // Connect last question to outcomes
    if (screenerJson.questions.length > 0) {
      const lastQuestion = screenerJson.questions[screenerJson.questions.length - 1];
      edges.push({
        id: `${lastQuestion.id}-to-${outcome}`,
        source: `question-${lastQuestion.id}`,
        target: nodeId,
      });
    }
  });

  return { nodes, edges };
}

interface TenantData {
  name: string;
  domain: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  drugProgram: {
    name: string;
    brandName: string;
    slug: string;
    screenerTitle: string;
    screenerJson: ScreenerJSON;
  };
  brandConfig: {
    name: string;
    logoUrl: string;
    primaryColor: string;
  };
}

// 10 Major Pharmaceutical Tenants with Realistic Data
const PHARMA_TENANTS: TenantData[] = [
  {
    name: 'Kenvue',
    domain: 'kenvue.com',
    adminEmail: 'benjamin.serbiak@kenvue.com',
    adminFirstName: 'Benjamin',
    adminLastName: 'Serbiak',
    brandConfig: {
      name: 'Tylenol Brand',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tylenol_logo.svg/1200px-Tylenol_logo.svg.png',
      primaryColor: '#E31837',
    },
    drugProgram: {
      name: 'Tylenol Sleep Rx Transition',
      brandName: 'Tylenol PM Plus',
      slug: 'tylenol-sleep-rx',
      screenerTitle: 'Tylenol Sleep Rx Screening',
      screenerJson: {
        title: 'Tylenol Sleep Rx Transition Screening',
        description: 'This screening helps determine if Tylenol PM Plus (Acetaminophen + Low-Dose Doxepin OTC) is appropriate for you. Please answer honestly.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'pregnancy_check',
            type: 'boolean',
            text: 'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
            required: true,
          },
          {
            id: 'maoi_check',
            type: 'boolean',
            text: 'Have you taken a Monoamine Oxidase Inhibitor (MAOI) antidepressant (e.g., Phenelzine, Tranylcypromine) in the last 14 days? If unsure, select Yes.',
            required: true,
          },
          {
            id: 'glaucoma_check',
            type: 'boolean',
            text: 'Do you have narrow-angle glaucoma or severe urinary retention?',
            required: true,
          },
          {
            id: 'other_sleep_meds',
            type: 'boolean',
            text: 'Are you currently taking any other prescription or over-the-counter sleep medication?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'pregnancy_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is not recommended during pregnancy or breastfeeding.',
            },
            {
              condition: 'maoi_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use if you have taken an MAOI in the last 14 days. This can cause serious drug interactions.',
            },
            {
              condition: 'glaucoma_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is contraindicated for people with narrow-angle glaucoma or severe urinary retention.',
            },
            {
              condition: 'other_sleep_meds == "yes"',
              outcome: 'ask_a_doctor',
              message: 'Please consult your doctor before combining sleep medications.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'This product contains acetaminophen and doxepin.',
          'Do not exceed recommended dose.',
          'Consult a doctor if sleeplessness persists for more than 2 weeks.',
        ],
      },
    },
  },
  {
    name: 'Haleon',
    domain: 'haleon.com',
    adminEmail: 'sarah.mitchell@haleon.com',
    adminFirstName: 'Sarah',
    adminLastName: 'Mitchell',
    brandConfig: {
      name: 'Advair Brand',
      logoUrl: 'https://www.advair.com/content/dam/cf-consumer-healthcare/advair-com/en_us/logos/advair-logo.png',
      primaryColor: '#0066CC',
    },
    drugProgram: {
      name: 'Advair Diskus 100/50 OTC Pilot',
      brandName: 'Advair OTC',
      slug: 'advair-otc-pilot',
      screenerTitle: 'Advair Diskus OTC Screening',
      screenerJson: {
        title: 'Advair Diskus 100/50 OTC Screening',
        description: 'This screening helps determine if Advair Diskus (Fluticasone/Salmeterol) OTC is appropriate for you. This medication is for long-term asthma or COPD control, NOT for rescue use.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'diagnosis_check',
            type: 'boolean',
            text: 'Has a doctor diagnosed you with Asthma or COPD (Chronic Obstructive Pulmonary Disease)?',
            required: true,
            ehrMapping: {
              rule: 'optional',
              fhirPath: 'Condition.asthma_copd',
              displayName: 'Asthma or COPD Diagnosis',
            },
          },
          {
            id: 'rescue_inhaler_freq',
            type: 'choice',
            text: 'How often do you typically use your rescue inhaler (e.g., Albuterol) for sudden symptoms?',
            required: true,
            options: ['Less than twice a week', '2-3 times a week', 'Most days', 'Multiple times a day'],
          },
          {
            id: 'acute_attack',
            type: 'boolean',
            text: 'Are you currently experiencing a severe asthma attack or sudden worsening of breathing? This medication is NOT for rescue use.',
            required: true,
          },
          {
            id: 'heart_conditions',
            type: 'boolean',
            text: 'Do you have any heart conditions (like high blood pressure or irregular heartbeat)?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'diagnosis_check == "no"',
              outcome: 'do_not_use',
              message: 'This product requires a confirmed diagnosis of Asthma or COPD from a doctor.',
            },
            {
              condition: 'rescue_inhaler_freq == "Multiple times a day"',
              outcome: 'ask_a_doctor',
              message: 'Your symptoms may require stronger prescription management. Please consult your doctor.',
            },
            {
              condition: 'acute_attack == "yes"',
              outcome: 'do_not_use',
              message: 'Use your rescue inhaler immediately. This medication is for long-term control, not acute attacks. Seek medical attention if needed.',
            },
            {
              condition: 'heart_conditions == "yes"',
              outcome: 'ask_a_doctor',
              message: 'Please consult your doctor before using this product if you have heart conditions.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'This is a long-term controller medication, not a rescue inhaler.',
          'Always keep your rescue inhaler with you.',
          'Rinse mouth after each use to prevent oral thrush.',
        ],
        educationModule: {
          required: true,
          content: [
            {
              type: 'text',
              markdown: `### Important Safety Information

Advair Diskus is a **long-term controller medication** for asthma and COPD, containing two active ingredients:

- **Fluticasone** (a corticosteroid) - reduces inflammation in the airways
- **Salmeterol** (a long-acting beta-agonist) - helps relax and open airways for 12 hours

#### Critical Points to Remember:

1. **NOT for Rescue Use**: This medication does NOT work quickly. It's designed for daily use to prevent symptoms, not to treat sudden breathing problems.

2. **Keep Your Rescue Inhaler**: Always have your fast-acting rescue inhaler (like albuterol) available for sudden symptoms.

3. **Use Exactly as Prescribed**: Take 1 inhalation twice daily (morning and evening), approximately 12 hours apart.

4. **Rinse Your Mouth**: After each use, rinse your mouth with water and spit it out to prevent oral thrush (yeast infection).

5. **Do Not Stop Suddenly**: Even if you feel better, continue using unless your doctor tells you to stop.

#### Warning Signs - Seek Medical Help Immediately:

- Breathing problems get worse after using Advair
- Severe allergic reaction (rash, swelling, difficulty breathing)
- Fast or irregular heartbeat
- Chest pain
- Increased wheezing immediately after dosing`,
            },
          ],
        },
        comprehensionCheck: {
          required: true,
          passingScore: 80,
          questions: [
            {
              id: 'cq1',
              text: 'What should you do if you experience sudden breathing difficulty or an asthma attack?',
              options: [
                'Use my Advair Diskus immediately',
                'Use my rescue inhaler (like albuterol)',
                'Take an extra dose of Advair',
                'Wait 12 hours for the next scheduled dose',
              ],
              correctAnswer: 'Use my rescue inhaler (like albuterol)',
            },
            {
              id: 'cq2',
              text: 'How often should you use Advair Diskus for long-term control?',
              options: [
                'Only when I have breathing problems',
                'Once daily in the morning',
                'Twice daily (morning and evening)',
                'As needed for rescue',
              ],
              correctAnswer: 'Twice daily (morning and evening)',
            },
            {
              id: 'cq3',
              text: 'Why is it important to rinse your mouth after using Advair Diskus?',
              options: [
                'To prevent oral thrush (yeast infection)',
                'To make it taste better',
                'To help it work faster',
                'To prevent tooth decay',
              ],
              correctAnswer: 'To prevent oral thrush (yeast infection)',
            },
            {
              id: 'cq4',
              text: 'What type of medication is Advair Diskus?',
              options: [
                'A rescue inhaler for sudden breathing problems',
                'An antibiotic for lung infections',
                'A long-term controller for daily use',
                'A pain reliever',
              ],
              correctAnswer: 'A long-term controller for daily use',
            },
            {
              id: 'cq5',
              text: 'Which of the following would require immediate medical attention while using Advair?',
              options: [
                'Mild throat irritation',
                'Chest pain or irregular heartbeat',
                'Slight cough',
                'Dry mouth',
              ],
              correctAnswer: 'Chest pain or irregular heartbeat',
            },
          ],
          failOutcome: 'ask_a_doctor',
          allowRetry: true,
        },
      },
    },
  },
  {
    name: 'Pfizer',
    domain: 'pfizer.com',
    adminEmail: 'michael.thompson@pfizer.com',
    adminFirstName: 'Michael',
    adminLastName: 'Thompson',
    brandConfig: {
      name: 'Viagra Connect Brand',
      logoUrl: 'https://www.viagra.com/themes/custom/viagra/logo.svg',
      primaryColor: '#0069B4',
    },
    drugProgram: {
      name: 'Viagra Connect USA',
      brandName: 'Viagra Connect',
      slug: 'viagra-connect-usa',
      screenerTitle: 'Viagra Connect Screening',
      screenerJson: {
        title: 'Viagra Connect USA Screening',
        description: 'This screening helps determine if Viagra Connect (Sildenafil 50mg OTC) is safe and appropriate for you.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you male and 18 years of age or older?',
            required: true,
          },
          {
            id: 'indication_check',
            type: 'boolean',
            text: 'Are you seeking this medication to treat symptoms of erectile dysfunction (difficulty getting or keeping an erection)?',
            required: true,
          },
          {
            id: 'nitrates_check',
            type: 'boolean',
            text: 'Are you currently taking ANY form of nitrate medication (e.g., nitroglycerin for chest pain, amyl nitrite)? Taking Viagra with nitrates can cause a dangerous drop in blood pressure.',
            required: true,
          },
          {
            id: 'heart_health_check',
            type: 'boolean',
            text: 'Has a doctor advised you that sexual activity is inadvisable due to heart problems? Or have you experienced chest pain during sex in the last 6 months?',
            required: true,
          },
          {
            id: 'severe_conditions',
            type: 'boolean',
            text: 'Do you have severe liver or kidney problems, low blood pressure, or have you had a recent heart attack or stroke (within 6 months)?',
            required: true,
          },
          {
            id: 'other_ed_meds',
            type: 'boolean',
            text: 'Are you taking any other medications for erectile dysfunction (prescription or otherwise)?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adult males 18 years and older.',
            },
            {
              condition: 'indication_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is specifically for treating erectile dysfunction.',
            },
            {
              condition: 'nitrates_check == "yes"',
              outcome: 'do_not_use',
              message: 'CRITICAL: Do not use Viagra with nitrates. This can cause a dangerous drop in blood pressure.',
            },
            {
              condition: 'heart_health_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use this product if sexual activity is inadvisable or if you have experienced chest pain during sex.',
            },
            {
              condition: 'severe_conditions == "yes"',
              outcome: 'do_not_use',
              message: 'This product is not safe for people with severe liver/kidney problems, low blood pressure, or recent heart attack/stroke.',
            },
            {
              condition: 'other_ed_meds == "yes"',
              outcome: 'ask_a_doctor',
              message: 'Do not combine erectile dysfunction medications without consulting your doctor.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'If you experience chest pain during sex, stop and seek medical help immediately.',
          'Erection lasting more than 4 hours requires immediate medical attention.',
          'Common side effects include headache, flushing, and indigestion.',
        ],
      },
    },
  },
  {
    name: 'Sanofi',
    domain: 'sanofi.com',
    adminEmail: 'jennifer.rodriguez@sanofi.com',
    adminFirstName: 'Jennifer',
    adminLastName: 'Rodriguez',
    brandConfig: {
      name: 'Cialis Brand',
      logoUrl: 'https://www.cialis.com/assets/images/logo.svg',
      primaryColor: '#F79420',
    },
    drugProgram: {
      name: 'Cialis Daily OTC Access',
      brandName: 'Cialis Daily',
      slug: 'cialis-daily-otc',
      screenerTitle: 'Cialis Daily Screening',
      screenerJson: {
        title: 'Cialis Daily OTC Access Screening',
        description: 'This screening helps determine if Cialis Daily (Tadalafil 5mg OTC) is safe and appropriate for you.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you male and 18 years of age or older?',
            required: true,
          },
          {
            id: 'indication_check',
            type: 'boolean',
            text: 'Are you seeking this medication for erectile dysfunction (ED) or benign prostatic hyperplasia (BPH) symptoms?',
            required: true,
          },
          {
            id: 'nitrates_check',
            type: 'boolean',
            text: 'Are you currently taking ANY form of nitrate medication (e.g., nitroglycerin for chest pain)? Taking Cialis with nitrates can cause a dangerous drop in blood pressure.',
            required: true,
          },
          {
            id: 'heart_health_check',
            type: 'boolean',
            text: 'Has a doctor advised you that sexual activity is inadvisable due to heart problems? Or have you had a recent heart attack or stroke (within 6 months)?',
            required: true,
          },
          {
            id: 'severe_conditions',
            type: 'boolean',
            text: 'Do you have severe liver or kidney problems, or low blood pressure?',
            required: true,
          },
          {
            id: 'alpha_blocker_check',
            type: 'boolean',
            text: 'Are you taking alpha-blockers (e.g., for BPH or high blood pressure)?',
            required: true,
          },
          {
            id: 'other_ed_meds',
            type: 'boolean',
            text: 'Are you taking any other medications for erectile dysfunction?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adult males 18 years and older.',
            },
            {
              condition: 'indication_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is specifically for treating ED or BPH symptoms.',
            },
            {
              condition: 'nitrates_check == "yes"',
              outcome: 'do_not_use',
              message: 'CRITICAL: Do not use Cialis with nitrates. This can cause a dangerous drop in blood pressure.',
            },
            {
              condition: 'heart_health_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use this product if sexual activity is inadvisable or if you have had a recent heart attack/stroke.',
            },
            {
              condition: 'severe_conditions == "yes"',
              outcome: 'do_not_use',
              message: 'This product is not safe for people with severe liver/kidney problems or low blood pressure.',
            },
            {
              condition: 'alpha_blocker_check == "yes"',
              outcome: 'ask_a_doctor',
              message: 'Cialis can interact with alpha-blockers. Please consult your doctor before using.',
            },
            {
              condition: 'other_ed_meds == "yes"',
              outcome: 'ask_a_doctor',
              message: 'Do not combine erectile dysfunction medications without consulting your doctor.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'If you experience chest pain during sex, stop and seek medical help immediately.',
          'Erection lasting more than 4 hours requires immediate medical attention.',
          'Do not take more than one dose per day.',
        ],
      },
    },
  },
  {
    name: 'AstraZeneca',
    domain: 'astrazeneca.com',
    adminEmail: 'david.chen@astrazeneca.com',
    adminFirstName: 'David',
    adminLastName: 'Chen',
    brandConfig: {
      name: 'Crestor Brand',
      logoUrl: 'https://www.crestor.com/content/dam/brand/crestor-logo.png',
      primaryColor: '#8B1E3F',
    },
    drugProgram: {
      name: 'Crestor Direct Access',
      brandName: 'Crestor OTC',
      slug: 'crestor-direct-access',
      screenerTitle: 'Crestor Direct Access Screening',
      screenerJson: {
        title: 'Crestor Direct Access Screening',
        description: 'This screening helps determine if Crestor (Rosuvastatin 5mg OTC) is appropriate for you based on the TACTiC trial criteria.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'pregnancy_check',
            type: 'boolean',
            text: 'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
            required: true,
          },
          {
            id: 'liver_disease',
            type: 'boolean',
            text: 'Do you have active liver disease or unexplained persistent elevated liver enzymes?',
            required: true,
          },
          {
            id: 'current_statin',
            type: 'boolean',
            text: 'Are you currently taking another statin or cholesterol-lowering prescription medication?',
            required: true,
          },
          {
            id: 'ldl_check',
            type: 'numeric',
            text: 'What is your most recent LDL ("bad") cholesterol level in mg/dL? (Enter 0 if you do not know)',
            required: true,
            validation: {
              min: 0,
              max: 300,
            },
            ehrMapping: {
              rule: 'optional',
              fhirPath: 'Observation.ldl',
              displayName: 'LDL Cholesterol Level',
            },
          },
          {
            id: 'cholesterol_test',
            type: 'diagnostic_test',
            text: 'Do you have recent cholesterol test results from within the last 12 months?',
            required: true,
            testType: 'Lipid panel / Cholesterol blood test',
          },
          {
            id: 'risk_factors',
            type: 'choice',
            text: 'Do you have any of the following cardiovascular risk factors?',
            required: true,
            options: ['None', 'High blood pressure', 'Diabetes', 'Current smoker', 'Family history of early heart disease'],
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'pregnancy_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use during pregnancy or breastfeeding. Statins can harm an unborn baby.',
            },
            {
              condition: 'liver_disease == "yes"',
              outcome: 'do_not_use',
              message: 'This product is contraindicated for people with active liver disease.',
            },
            {
              condition: 'current_statin == "yes"',
              outcome: 'do_not_use',
              message: 'Do not take multiple statin medications. Please consult your doctor.',
            },
            {
              condition: 'cholesterol_test.hasTest == false',
              outcome: 'ask_a_doctor',
              message: 'You need recent cholesterol test results (within 12 months) to use this product. Please consult your doctor for testing.',
            },
            {
              condition: 'ldl_check == 0',
              outcome: 'ask_a_doctor',
              message: 'You need to know your LDL cholesterol level before using this product. Please get tested.',
            },
            {
              condition: 'ldl_check < 130',
              outcome: 'ask_a_doctor',
              message: 'Your LDL cholesterol may not require statin therapy. Please consult your doctor.',
            },
            {
              condition: 'ldl_check > 190',
              outcome: 'ask_a_doctor',
              message: 'Your LDL cholesterol is very high. You may need prescription-strength medication. Please consult your doctor.',
            },
            {
              condition: 'ldl_check >= 130 && ldl_check <= 159 && risk_factors == "None"',
              outcome: 'ask_a_doctor',
              message: 'With your LDL level and no risk factors, please consult your doctor about whether statin therapy is appropriate.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'Take at the same time each day with or without food.',
          'Continue following a cholesterol-lowering diet.',
          'Report any unexplained muscle pain or weakness to your doctor immediately.',
        ],
      },
    },
  },
  {
    name: 'Merck',
    domain: 'merck.com',
    adminEmail: 'emily.johnson@merck.com',
    adminFirstName: 'Emily',
    adminLastName: 'Johnson',
    brandConfig: {
      name: 'Januvia Brand',
      logoUrl: 'https://www.januvia.com/assets/images/januvia-logo.svg',
      primaryColor: '#005EB8',
    },
    drugProgram: {
      name: 'Januvia Pre-Care',
      brandName: 'Januvia OTC',
      slug: 'januvia-pre-care',
      screenerTitle: 'Januvia Pre-Care Screening',
      screenerJson: {
        title: 'Januvia Pre-Care Screening',
        description: 'This screening helps determine if Januvia (Sitagliptin 25mg OTC) is appropriate for you. This medication is for Type 2 Diabetes or Pre-diabetes management.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'diagnosis_check',
            type: 'boolean',
            text: 'Has a doctor diagnosed you with Type 2 Diabetes or Pre-diabetes based on an A1c test?',
            required: true,
            ehrMapping: {
              rule: 'optional',
              fhirPath: 'Condition.diabetes',
              displayName: 'Type 2 Diabetes or Pre-diabetes Diagnosis',
            },
          },
          {
            id: 'kidney_check',
            type: 'choice',
            text: 'Do you have kidney disease? If unsure, select "I do not know".',
            required: true,
            options: ['No kidney disease', 'Mild kidney disease', 'Moderate to severe kidney disease', 'I do not know'],
          },
          {
            id: 'pancreatitis_check',
            type: 'boolean',
            text: 'Have you ever had pancreatitis (inflammation of the pancreas)?',
            required: true,
          },
          {
            id: 'current_diabetes_meds',
            type: 'boolean',
            text: 'Are you currently taking insulin or any other prescription medication for diabetes?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'diagnosis_check == "no"',
              outcome: 'do_not_use',
              message: 'This product requires a confirmed diagnosis of Type 2 Diabetes or Pre-diabetes from a doctor.',
            },
            {
              condition: 'kidney_check == "Moderate to severe kidney disease"',
              outcome: 'do_not_use',
              message: 'This product is not recommended for people with moderate to severe kidney disease.',
            },
            {
              condition: 'kidney_check == "I do not know"',
              outcome: 'do_not_use',
              message: 'Please have your kidney function tested before using this product.',
            },
            {
              condition: 'pancreatitis_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is not recommended for people with a history of pancreatitis.',
            },
            {
              condition: 'current_diabetes_meds == "yes"',
              outcome: 'do_not_use',
              message: 'Do not combine diabetes medications without consulting your doctor first.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'Continue following your diabetes diet and exercise plan.',
          'Monitor your blood sugar regularly.',
          'Report any severe stomach pain to your doctor immediately.',
        ],
      },
    },
  },
  {
    name: 'Eli Lilly',
    domain: 'lilly.com',
    adminEmail: 'robert.williams@lilly.com',
    adminFirstName: 'Robert',
    adminLastName: 'Williams',
    brandConfig: {
      name: 'Weight Journey Brand',
      logoUrl: 'https://www.lilly.com/themes/custom/lilly_base/logo.svg',
      primaryColor: '#E4002B',
    },
    drugProgram: {
      name: 'Weight Journey Start',
      brandName: 'Weight Journey',
      slug: 'weight-journey-start',
      screenerTitle: 'Weight Journey Start Screening',
      screenerJson: {
        title: 'Weight Journey Start Screening',
        description: 'This screening helps determine if Weight Journey (Tirzepatide Low-Dose Pen OTC) is appropriate for you. This medication is for weight management in adults with elevated BMI.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'height_input',
            type: 'numeric',
            text: 'What is your height in inches? (Example: 5 feet 6 inches = 66 inches)',
            required: true,
            validation: {
              min: 48,
              max: 96,
            },
          },
          {
            id: 'weight_input',
            type: 'numeric',
            text: 'What is your weight in pounds?',
            required: true,
            validation: {
              min: 80,
              max: 600,
            },
          },
          {
            id: 'thyroid_cancer_check',
            type: 'boolean',
            text: 'Do you or any family members have a history of Medullary Thyroid Carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)? If unsure, select Yes.',
            required: true,
          },
          {
            id: 'pancreatitis_check',
            type: 'boolean',
            text: 'Have you ever had pancreatitis (inflammation of the pancreas)?',
            required: true,
          },
          {
            id: 'kidney_check',
            type: 'boolean',
            text: 'Do you have severe kidney problems or are you on dialysis?',
            required: true,
          },
          {
            id: 'pregnancy_check',
            type: 'boolean',
            text: 'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
            required: true,
          },
          {
            id: 'other_glp1_check',
            type: 'boolean',
            text: 'Are you currently using other GLP-1 agonists (e.g., Ozempic, Wegovy, Mounjaro) or insulin?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'thyroid_cancer_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use if you or family members have a history of MTC or MEN 2. Risk of thyroid tumors.',
            },
            {
              condition: 'pancreatitis_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is not recommended for people with a history of pancreatitis.',
            },
            {
              condition: 'kidney_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is not recommended for people with severe kidney problems or on dialysis.',
            },
            {
              condition: 'pregnancy_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use during pregnancy or breastfeeding. Stop 2 months before planned pregnancy.',
            },
            {
              condition: 'other_glp1_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not combine GLP-1 medications or use with insulin without consulting your doctor.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'Common side effects include nausea, vomiting, and diarrhea.',
          'Inject once weekly on the same day each week.',
          'Maintain a reduced-calorie diet and increase physical activity.',
          'Report severe stomach pain immediately - may indicate pancreatitis.',
        ],
      },
    },
  },
  {
    name: 'Bayer',
    domain: 'bayer.com',
    adminEmail: 'catherine.anderson@bayer.com',
    adminFirstName: 'Catherine',
    adminLastName: 'Anderson',
    brandConfig: {
      name: 'Stivarga Brand',
      logoUrl: 'https://www.stivarga.com/assets/images/stivarga-logo.svg',
      primaryColor: '#00A3E0',
    },
    drugProgram: {
      name: 'Stivarga Prevent',
      brandName: 'Stivarga Prevent',
      slug: 'stivarga-prevent',
      screenerTitle: 'Stivarga Prevent Screening',
      screenerJson: {
        title: 'Stivarga Prevent Screening',
        description: 'This screening helps determine if Stivarga Prevent (Regorafenib Low Dose) is appropriate for you. This medication is for cancer recurrence prevention in specific patients.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'cancer_type_check',
            type: 'boolean',
            text: 'Have you been previously diagnosed and successfully treated (currently in remission) for Colorectal Cancer Stage III?',
            required: true,
          },
          {
            id: 'treatment_history_check',
            type: 'boolean',
            text: 'Did you complete your primary treatment (surgery plus adjuvant chemotherapy) between 6 and 18 months ago?',
            required: true,
          },
          {
            id: 'liver_function_check',
            type: 'boolean',
            text: 'Have your recent liver function tests (AST/ALT) been within the normal range? If unsure, select No.',
            required: true,
          },
          {
            id: 'contraindications_check',
            type: 'boolean',
            text: 'Do you have any of the following: severe bleeding disorders, uncontrolled high blood pressure, or recent surgery (within 4 weeks)?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'cancer_type_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for patients with a confirmed history of Stage III Colorectal Cancer.',
            },
            {
              condition: 'treatment_history_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only appropriate for patients who completed treatment 6-18 months ago.',
            },
            {
              condition: 'liver_function_check == "no"',
              outcome: 'do_not_use',
              message: 'This product requires normal liver function. Please have your liver function tested.',
            },
            {
              condition: 'contraindications_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is contraindicated for people with bleeding disorders, uncontrolled high blood pressure, or recent surgery.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'This is a specialized medication for cancer recurrence prevention.',
          'Regular monitoring by your oncologist is required.',
          'Report any unusual bleeding, severe abdominal pain, or jaundice immediately.',
        ],
      },
    },
  },
  {
    name: 'AbbVie',
    domain: 'abbvie.com',
    adminEmail: 'thomas.martin@abbvie.com',
    adminFirstName: 'Thomas',
    adminLastName: 'Martin',
    brandConfig: {
      name: 'Botox Cosmetic Brand',
      logoUrl: 'https://www.botoxcosmetic.com/content/dam/brand/botoxcosmetic-logo.png',
      primaryColor: '#6C2C91',
    },
    drugProgram: {
      name: 'Botox Cosmetic Touch-Up',
      brandName: 'Botox Touch-Up',
      slug: 'botox-cosmetic-touchup',
      screenerTitle: 'Botox Cosmetic Touch-Up Screening',
      screenerJson: {
        title: 'Botox Cosmetic Touch-Up Screening',
        description: 'This screening helps determine if Botox Cosmetic Touch-Up (OnabotulinumtoxinA Micro-dose Pen OTC) is appropriate for you. This product is for cosmetic use only.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you between 25 and 65 years old?',
            required: true,
          },
          {
            id: 'indication_check',
            type: 'boolean',
            text: 'Are you seeking this product ONLY to temporarily improve the appearance of moderate to severe crow\'s feet lines?',
            required: true,
          },
          {
            id: 'neuro_disorder_check',
            type: 'boolean',
            text: 'Do you have any neuromuscular disorder (e.g., ALS, myasthenia gravis, Lambert-Eaton syndrome)?',
            required: true,
          },
          {
            id: 'skin_infection_check',
            type: 'boolean',
            text: 'Do you have a skin infection at the planned injection site?',
            required: true,
          },
          {
            id: 'allergy_check',
            type: 'boolean',
            text: 'Are you allergic to botulinum toxin products or any ingredients in this product?',
            required: true,
          },
          {
            id: 'pregnancy_check',
            type: 'boolean',
            text: 'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
            required: true,
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults between 25 and 65 years old.',
            },
            {
              condition: 'indication_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is specifically for crow\'s feet lines only.',
            },
            {
              condition: 'neuro_disorder_check == "yes"',
              outcome: 'do_not_use',
              message: 'This product is contraindicated for people with neuromuscular disorders.',
            },
            {
              condition: 'skin_infection_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not inject into infected skin. Wait until the infection clears.',
            },
            {
              condition: 'allergy_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use if you are allergic to botulinum toxin or product ingredients.',
            },
            {
              condition: 'pregnancy_check == "yes"',
              outcome: 'do_not_use',
              message: 'Not recommended during pregnancy or breastfeeding.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'Watch mandatory training video on proper injection technique before use.',
          'Results typically appear in 3-7 days and last 3-4 months.',
          'Do not exceed recommended dosage or frequency.',
        ],
      },
    },
  },
  {
    name: 'Procter & Gamble Health',
    domain: 'pghealth.com',
    adminEmail: 'maria.garcia@pghealth.com',
    adminFirstName: 'Maria',
    adminLastName: 'Garcia',
    brandConfig: {
      name: 'Metamucil Cardio Brand',
      logoUrl: 'https://www.metamucil.com/content/dam/brands/metamucil/logo.svg',
      primaryColor: '#FF6F00',
    },
    drugProgram: {
      name: 'Metamucil Cardio Plus',
      brandName: 'Metamucil Cardio+',
      slug: 'metamucil-cardio-plus',
      screenerTitle: 'Metamucil Cardio+ Screening',
      screenerJson: {
        title: 'Metamucil Cardio+ Screening',
        description: 'This screening helps determine if Metamucil Cardio+ (Psyllium + Plant Sterols + Low-Dose Statin) is appropriate for you.',
        questions: [
          {
            id: 'age_check',
            type: 'boolean',
            text: 'Are you 18 years of age or older?',
            required: true,
          },
          {
            id: 'pregnancy_check',
            type: 'boolean',
            text: 'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
            required: true,
          },
          {
            id: 'liver_disease',
            type: 'boolean',
            text: 'Do you have active liver disease or unexplained persistent elevated liver enzymes?',
            required: true,
          },
          {
            id: 'current_statin',
            type: 'boolean',
            text: 'Are you currently taking another statin or cholesterol-lowering prescription medication?',
            required: true,
          },
          {
            id: 'swallowing_difficulty',
            type: 'boolean',
            text: 'Do you have difficulty swallowing or any intestinal blockage?',
            required: true,
          },
          {
            id: 'ldl_check',
            type: 'numeric',
            text: 'What is your most recent LDL ("bad") cholesterol level in mg/dL? (Enter 0 if you do not know)',
            required: true,
            validation: {
              min: 0,
              max: 300,
            },
            ehrMapping: {
              rule: 'optional',
              fhirPath: 'Observation.ldl',
              displayName: 'LDL Cholesterol Level',
            },
          },
        ],
        logic: {
          rules: [
            {
              condition: 'age_check == "no"',
              outcome: 'do_not_use',
              message: 'This product is only for adults 18 years and older.',
            },
            {
              condition: 'pregnancy_check == "yes"',
              outcome: 'do_not_use',
              message: 'Do not use during pregnancy or breastfeeding.',
            },
            {
              condition: 'liver_disease == "yes"',
              outcome: 'do_not_use',
              message: 'This product is contraindicated for people with active liver disease.',
            },
            {
              condition: 'current_statin == "yes"',
              outcome: 'do_not_use',
              message: 'Do not take multiple statin medications. Please consult your doctor.',
            },
            {
              condition: 'swallowing_difficulty == "yes"',
              outcome: 'do_not_use',
              message: 'This product contains fiber and is not safe for people with swallowing difficulties or intestinal blockage.',
            },
            {
              condition: 'ldl_check == 0',
              outcome: 'ask_a_doctor',
              message: 'You need to know your LDL cholesterol level before using this product. Please get tested.',
            },
            {
              condition: 'ldl_check < 130',
              outcome: 'ask_a_doctor',
              message: 'Your LDL cholesterol may not require statin therapy. Please consult your doctor.',
            },
            {
              condition: 'ldl_check > 190',
              outcome: 'ask_a_doctor',
              message: 'Your LDL cholesterol is very high. You may need prescription-strength medication. Please consult your doctor.',
            },
          ],
          defaultOutcome: 'ok_to_use',
        },
        disclaimers: [
          'Mix with at least 8 ounces of water and drink immediately.',
          'Take at least 2 hours before or after other medications.',
          'Continue following a cholesterol-lowering diet.',
          'Drink plenty of fluids throughout the day.',
        ],
      },
    },
  },
];

const DEFAULT_PASSWORD = 'password123';

async function clearExistingData() {
  console.log('🧹 Clearing existing data...\n');
  
  // Delete in reverse dependency order
  await db.delete(verificationCodes);
  await db.delete(screeningSessions);
  await db.delete(partnerConfigs);
  await db.delete(partnerApiKeys);
  await db.delete(partners);
  await db.delete(screenerVersions);
  await db.delete(drugPrograms);
  await db.delete(brandConfigs);
  await db.delete(tenantUsers);
  
  // Keep super admin, delete other data
  await db.delete(tenants);
  
  console.log('✅ Data cleared\n');
}

async function seedComprehensiveData() {
  try {
    console.log('🌱 Starting comprehensive seed data generation...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Optional: Clear existing data
    // await clearExistingData();

    const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

    // Track created entities
    const createdData: any = {
      tenants: [],
      users: [],
      programs: [],
      sessions: [],
      codes: [],
    };

    // Process each pharmaceutical tenant
    for (const pharmaData of PHARMA_TENANTS) {
      console.log(`\n📦 Processing ${pharmaData.name}...`);
      
      // Step 1 & 2: Create admin user and tenant
      console.log(`   👤 Creating admin user: ${pharmaData.adminFirstName} ${pharmaData.adminLastName}`);
      
      let adminUser;
      try {
        [adminUser] = await db.insert(users).values({
          email: pharmaData.adminEmail,
          hashedPassword: hashedPassword,
          firstName: pharmaData.adminFirstName,
          lastName: pharmaData.adminLastName,
        }).returning();
        console.log(`   ✅ Admin user created`);
      } catch (error: any) {
        if (error.code === '23505') {
          const existingUser = await db.query.users.findFirst({
            where: eq(users.email, pharmaData.adminEmail),
          });
          if (!existingUser) throw error;
          adminUser = existingUser;
          console.log(`   ⚠️  User already exists, using existing...`);
        } else {
          throw error;
        }
      }

      // Create tenant
      console.log(`   🏢 Creating tenant: ${pharmaData.name}`);
      const [tenant] = await db.insert(tenants).values({
        name: pharmaData.name,
        status: 'active',
        metadata: {
          domain: pharmaData.domain,
          maxDrugPrograms: 10,
          maxUsers: 50,
        },
      }).returning();
      console.log(`   ✅ Tenant created`);


      createdData.tenants.push(tenant);

      // Step 3: Create tenant user relationship
      const existingTenantUser = await db.query.tenantUsers.findFirst({
        where: (tu, { and, eq }) => and(
          eq(tu.tenantId, tenant.id),
          eq(tu.userId, adminUser.id)
        ),
      });

      if (!existingTenantUser) {
        await db.insert(tenantUsers).values({
          tenantId: tenant.id,
          userId: adminUser.id,
          role: 'admin',
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        });
        console.log(`   ✅ Admin assigned to tenant`);
      }

      // Create additional team members with full names
      console.log(`   👥 Creating team members...`);
      const teamRoles: Array<'editor' | 'viewer' | 'clinician' | 'auditor'> = ['editor', 'viewer', 'clinician', 'auditor'];
      
      for (const role of teamRoles) {
        const name = createFullName();
        const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@${pharmaData.domain}`;
        
        let teamUser;
        try {
          [teamUser] = await db.insert(users).values({
            email,
            hashedPassword: hashedPassword,
            firstName: name.firstName,
            lastName: name.lastName,
          }).returning();
        } catch (error: any) {
          if (error.code === '23505') {
            const existingTeamUser = await db.query.users.findFirst({
              where: eq(users.email, email),
            });
            if (!existingTeamUser) throw error;
            teamUser = existingTeamUser;
          } else {
            throw error;
          }
        }

        const existingTeamTenantUser = await db.query.tenantUsers.findFirst({
          where: (tu, { and, eq }) => and(
            eq(tu.tenantId, tenant.id),
            eq(tu.userId, teamUser.id)
          ),
        });

        if (!existingTeamTenantUser) {
          await db.insert(tenantUsers).values({
            tenantId: tenant.id,
            userId: teamUser.id,
            role,
            createdBy: adminUser.id,
            updatedBy: adminUser.id,
          });
        }

        createdData.users.push({ user: teamUser, role });
      }
      console.log(`   ✅ Team members created`);

      // Step 4: Create brand configuration
      console.log(`   🎨 Creating brand configuration...`);
      const [brandConfig] = await db.insert(brandConfigs).values({
        tenantId: tenant.id,
        name: pharmaData.brandConfig.name,
        config: {
          logoUrl: pharmaData.brandConfig.logoUrl,
          primaryColor: pharmaData.brandConfig.primaryColor,
        },
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }).returning();
      console.log(`   ✅ Brand config created`);

      // Step 5: Create drug program
      console.log(`   💊 Creating drug program: ${pharmaData.drugProgram.name}...`);
      const [program] = await db.insert(drugPrograms).values({
        tenantId: tenant.id,
        brandConfigId: brandConfig.id,
        name: pharmaData.drugProgram.name,
        brandName: pharmaData.drugProgram.brandName,
        slug: pharmaData.drugProgram.slug,
        status: 'active',
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
      }).returning();
      console.log(`   ✅ Drug program created`);

      createdData.programs.push(program);

      // Step 6: Create historical screener versions (3 versions)
      console.log(`   📝 Creating screener versions (3 historical)...`);
      
      const screenerVersionsList: any[] = [];
      const versionNotes = [
        'Initial version - basic ACNU screening',
        'Enhanced version - added EHR mapping and diagnostic tests',
        'Current version - added education module and comprehension checks'
      ];
      
      for (let versionNum = 1; versionNum <= 3; versionNum++) {
        // Generate visual flow nodes and edges
        const { nodes, edges } = generateFlowNodesAndEdges(pharmaData.drugProgram.screenerJson);
        const screenerJsonWithFlow = {
          ...pharmaData.drugProgram.screenerJson,
          nodes,
          edges,
        };
        
        // Create timestamp for historical versions (v1: 90 days ago, v2: 30 days ago, v3: now)
        const createdAt = new Date();
        if (versionNum === 1) {
          createdAt.setDate(createdAt.getDate() - 90);
        } else if (versionNum === 2) {
          createdAt.setDate(createdAt.getDate() - 30);
        }
        
        const [version] = await db.insert(screenerVersions).values({
          tenantId: tenant.id,
          drugProgramId: program.id,
          version: versionNum,
          screenerJson: screenerJsonWithFlow,
          notes: versionNotes[versionNum - 1],
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
          createdAt,
          updatedAt: createdAt,
        }).returning();
        
        screenerVersionsList.push(version);
      }
      console.log(`   ✅ Created 3 screener versions`);

      // Set the latest version as active
      const activeVersion = screenerVersionsList[screenerVersionsList.length - 1];
      await db.update(drugPrograms)
        .set({ activeScreenerVersionId: activeVersion.id })
        .where(eq(drugPrograms.id, program.id));
      console.log(`   ✅ Active screener version set to v3`);

      // Step 7: Create partners
      console.log(`   🤝 Creating partners...`);
      const partnerNames = ['CVS Pharmacy Point of Sale', 'Walgreens E-commerce Platform'];
      
      for (const partnerName of partnerNames) {
        const [partner] = await db.insert(partners).values({
          tenantId: tenant.id,
          name: partnerName,
          type: partnerName.includes('POS') || partnerName.includes('Point of Sale') ? 'retail_pos' : 'ecommerce',
          status: 'active',
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        }).returning();

        // Create API key for partner
        const keyPrefix = nanoid(8);
        const keySecret = `test_${nanoid(32)}`;
        const hashedKey = await hashPassword(keySecret);

        await db.insert(partnerApiKeys).values({
          tenantId: tenant.id,
          partnerId: partner.id,
          keyPrefix,
          hashedKey,
          status: 'active',
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        });

        await db.insert(partnerConfigs).values({
          tenantId: tenant.id,
          partnerId: partner.id,
          metadata: {
            webhookUrl: `https://${partnerName.toLowerCase().replace(/\s+/g, '-')}.example.com/webhook`,
          },
          whitelistedRedirectUrls: ['https://example.com'],
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        });
      }
      console.log(`   ✅ Partners created`);

      // Step 8: Simulate screening sessions (100-150 total, distributed across versions)
      console.log(`   🧪 Simulating screening sessions...`);
      const sessionCount = faker.number.int({ min: 100, max: 150 });
      
      // Distribute sessions across versions: 30% v1, 30% v2, 40% v3
      const v1Count = Math.floor(sessionCount * 0.3);
      const v2Count = Math.floor(sessionCount * 0.3);
      const v3Count = sessionCount - v1Count - v2Count;
      
      for (let i = 0; i < sessionCount; i++) {
        // Determine which version this session belongs to
        let versionIndex: number;
        let daysAgo: number;
        if (i < v1Count) {
          versionIndex = 0; // v1
          daysAgo = faker.number.int({ min: 60, max: 90 }); // 60-90 days ago
        } else if (i < v1Count + v2Count) {
          versionIndex = 1; // v2
          daysAgo = faker.number.int({ min: 15, max: 30 }); // 15-30 days ago
        } else {
          versionIndex = 2; // v3
          daysAgo = faker.number.int({ min: 1, max: 14 }); // 1-14 days ago
        }
        
        const version = screenerVersionsList[versionIndex];
        
        // Generate realistic answers based on screener questions
        const answersJson: Record<string, any> = {};
        const questions = pharmaData.drugProgram.screenerJson.questions;
        
        for (const question of questions) {
          if (question.type === 'boolean') {
            // 70% say false (safe answers), 30% say true
            answersJson[question.id] = faker.datatype.boolean({ probability: 0.3 });
          } else if (question.type === 'numeric') {
            if (question.id.includes('ldl')) {
              // LDL cholesterol: 100-200 mg/dL range
              answersJson[question.id] = faker.number.int({ min: 100, max: 200 });
            } else if (question.id.includes('height')) {
              // Height in inches: 60-76
              answersJson[question.id] = faker.number.int({ min: 60, max: 76 });
            } else if (question.id.includes('weight')) {
              // Weight in pounds: 120-300
              answersJson[question.id] = faker.number.int({ min: 120, max: 300 });
            } else {
              answersJson[question.id] = faker.number.int({ min: 0, max: 200 });
            }
          } else if (question.type === 'choice' && question.options) {
            answersJson[question.id] = faker.helpers.arrayElement(question.options);
          }
        }

        // Determine outcome based on simple logic (simplified)
        let outcome: 'ok_to_use' | 'ask_a_doctor' | 'do_not_use';
        const hasDoNotUseAnswer = Object.entries(answersJson).some(([key, value]) => {
          if (key.includes('age') && value === false) return true;
          if (key.includes('pregnancy') && value === true) return true;
          if (key.includes('maoi') && value === true) return true;
          if (key.includes('nitrate') && value === true) return true;
          return false;
        });

        if (hasDoNotUseAnswer) {
          outcome = 'do_not_use';
        } else {
          // 70% ok_to_use, 20% ask_a_doctor, 10% do_not_use
          const rand = faker.number.float({ min: 0, max: 1 });
          if (rand < 0.7) outcome = 'ok_to_use';
          else if (rand < 0.9) outcome = 'ask_a_doctor';
          else outcome = 'do_not_use';
        }

        // Create session with timestamp matching the version period
        const completedAt = new Date();
        completedAt.setDate(completedAt.getDate() - daysAgo);

        const [session] = await db.insert(screeningSessions).values({
          tenantId: tenant.id,
          drugProgramId: program.id,
          screenerVersionId: version.id,
          path: faker.helpers.arrayElement(['manual', 'ehr_assisted', 'ehr_mandatory']),
          answersJson,
          outcome,
          status: 'completed',
          completedAt,
        }).returning();

        createdData.sessions.push(session);

        // Step 9: Generate verification code for ok_to_use sessions
        if (outcome === 'ok_to_use') {
          const code = nanoid(12).toUpperCase();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry

          const [verificationCode] = await db.insert(verificationCodes).values({
            tenantId: tenant.id,
            screeningSessionId: session.id,
            code,
            type: 'pos_barcode',
            expiresAt,
            status: faker.helpers.arrayElement(['unused', 'used', 'expired']),
          }).returning();

          createdData.codes.push(verificationCode);
        }
      }
      console.log(`   ✅ ${sessionCount} screening sessions created`);
      
      // Step 10: Create comprehensive audit logs
      console.log(`   📋 Creating audit logs...`);
      const auditLogEntries: any[] = [];
      
      // Get all team members for variety in audit logs
      const allTenantUsers = await db.query.tenantUsers.findMany({
        where: eq(tenantUsers.tenantId, tenant.id),
        with: { user: true }
      });
      
      // 1. Tenant creation log
      auditLogEntries.push({
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'tenant.create',
        entityType: 'Tenant',
        entityId: tenant.id,
        changes: { new: { name: tenant.name, status: tenant.status } },
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      });
      
      // 2. Admin user invitation
      auditLogEntries.push({
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'user.invite',
        entityType: 'TenantUser',
        entityId: adminUser.id,
        changes: { new: { email: adminUser.email, role: 'admin' } },
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      });
      
      // 3. Team member invitations (for each editor, viewer, clinician, auditor)
      allTenantUsers.slice(1).forEach((tu, index) => {
        auditLogEntries.push({
          tenantId: tenant.id,
          userId: adminUser.id,
          action: 'user.invite',
          entityType: 'TenantUser',
          entityId: tu.userId,
          changes: { new: { email: tu.user.email, role: tu.role } },
          timestamp: new Date(Date.now() - (85 - index * 2) * 24 * 60 * 60 * 1000),
        });
      });
      
      // 4. Brand configuration creation
      auditLogEntries.push({
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'brand.create',
        entityType: 'BrandConfig',
        entityId: brandConfig.id,
        changes: { new: { name: brandConfig.name } },
        timestamp: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
      });
      
      // 5. Drug program creation
      auditLogEntries.push({
        tenantId: tenant.id,
        userId: adminUser.id,
        action: 'program.create',
        entityType: 'DrugProgram',
        entityId: program.id,
        changes: { new: { name: program.name, slug: program.slug, status: 'active' } },
        timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      });
      
      // 6. Screener version creation logs (for each version)
      screenerVersionsList.forEach((version, index) => {
        const daysAgo = index === 0 ? 90 : index === 1 ? 30 : 0;
        auditLogEntries.push({
          tenantId: tenant.id,
          userId: adminUser.id,
          action: 'screener.version.create',
          entityType: 'ScreenerVersion',
          entityId: version.id,
          changes: { new: { version: version.version, notes: version.notes } },
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        });
        
        // Also log screener publish action for v2 and v3
        if (index > 0) {
          auditLogEntries.push({
            tenantId: tenant.id,
            userId: adminUser.id,
            action: 'screener.publish',
            entityType: 'DrugProgram',
            entityId: program.id,
            changes: {
              old: { activeScreenerVersionId: screenerVersionsList[index - 1].id },
              new: { activeScreenerVersionId: version.id }
            },
            timestamp: new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000),
          });
        }
      });
      
      // 7. Partner creation logs
      const partnersList = await db.query.partners.findMany({
        where: eq(partners.tenantId, tenant.id)
      });
      partnersList.forEach((partner, index) => {
        auditLogEntries.push({
          tenantId: tenant.id,
          userId: adminUser.id,
          action: 'partner.create',
          entityType: 'Partner',
          entityId: partner.id,
          changes: { new: { name: partner.name, type: partner.type, status: 'active' } },
          timestamp: new Date(Date.now() - (80 - index * 2) * 24 * 60 * 60 * 1000),
        });
      });
      
      // 8. Partner API key generation logs
      const apiKeysList = await db.query.partnerApiKeys.findMany({
        where: eq(partnerApiKeys.tenantId, tenant.id),
        with: { partner: true }
      });
      apiKeysList.forEach((key, index) => {
        auditLogEntries.push({
          tenantId: tenant.id,
          userId: adminUser.id,
          action: 'partner.key.create',
          entityType: 'PartnerApiKey',
          entityId: key.id,
          changes: { new: { partnerId: key.partnerId, keyPrefix: key.keyPrefix, status: 'active' } },
          timestamp: new Date(Date.now() - (75 - index * 2) * 24 * 60 * 60 * 1000),
        });
      });
      
      // 9. Sample verification success logs (for some codes)
      const recentCodes = createdData.codes.filter((c: any) => c.status === 'used').slice(0, 5);
      recentCodes.forEach((code: any, index: number) => {
        auditLogEntries.push({
          tenantId: tenant.id,
          userId: null, // System action via partner
          action: 'verification.success',
          entityType: 'VerificationCode',
          entityId: code.id,
          changes: {
            old: { status: 'unused' },
            new: { status: 'used' }
          },
          timestamp: new Date(Date.now() - (7 - index) * 24 * 60 * 60 * 1000),
        });
      });
      
      // Insert all audit logs
      if (auditLogEntries.length > 0) {
        await db.insert(auditLogs).values(auditLogEntries);
      }
      console.log(`   ✅ Created ${auditLogEntries.length} audit log entries`);
      
      console.log(`✅ ${pharmaData.name} complete!\n`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Comprehensive Seed Data Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   • Tenants:            ${createdData.tenants.length}`);
    console.log(`   • Drug Programs:      ${createdData.programs.length}`);
    console.log(`   • Screening Sessions: ${createdData.sessions.length}`);
    console.log(`   • Verification Codes: ${createdData.codes.length}`);
    console.log('\n🔐 Default Password: password123');
    console.log('⚠️  SECURITY: Change all passwords after first login!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedComprehensiveData();
