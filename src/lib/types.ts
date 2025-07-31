import {z} from 'zod';

export type UserRole = 'enduser' | 'consultant' | 'admin';

export type AccessRequestStatus = 'pending' | 'approved' | 'declined';

export interface AccessRequest {
  requestId: string;
  consultantId: string;
  consultantName: string;
  status: AccessRequestStatus;
  requestedAt: string;
  approvedAt?: string;
  rejectionCount?: number;
}

export type DocumentCategory =
  | 'Lab'
  | 'Clinical'
  | 'Hospital'
  | 'Estimate'
  | 'Other';

export const ScanDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to scan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export const StructuredDocumentSummarySchema = z.object({
  instituteName: z
    .string()
    .describe('The name of the clinic, lab, or hospital.'),
  patientName: z.string().describe('The name of the person from the document.'),
  age: z.string().describe('The age of the person.'),
  gender: z.string().describe('The gender of the person.'),
  testName: z.string().describe('The name of the treatment or test.'),
  outcome: z
    .string()
    .describe(
      'The possible disease name or conclusion in simple, understandable format.'
    ),
  otherInfo: z.string().describe('Other relevant findings.'),
  category: z
    .enum(['Lab', 'Clinical', 'Hospital', 'Estimate', 'Other'])
    .describe('The determined category of the document.'),
  extractedText: z
    .string()
    .describe('The full extracted text from the document.'),
});

export type StructuredDocumentSummary = z.infer<
  typeof StructuredDocumentSummarySchema
>;

export interface Document {
  id: string;
  name: string;
  dataUri: string;
  uploadedAt: string;
  category: DocumentCategory;
  extractedText?: string;
  summary?: StructuredDocumentSummary;
}

export interface SessionComment {
  id: string;
  consultantId: string;
  consultantName: string;
  comment: string;
  timestamp: string;
}

export interface PrescriptionRecord {
  id: string;
  consultantId: string;
  consultantName: string;
  text: string;
  timestamp: string;
}

export interface Reminder {
  id: string;
  type: 'medication' | 'appointment';
  title: string;
  dateTime: string; // ISO string for the specific time

  // For medication
  notion?: string; // "before breakfast", "after dinner"
  endDate?: string; // for date ranges

  // For appointment
  doctorName?: string;
}

export const HealthyTipsInputSchema = z.object({
  diseaseName: z
    .string()
    .describe("The name of the user's primary health condition or disease."),
  stage: z
    .string()
    .describe("The stage of the disease, if applicable (e.g., 'Stage 2', 'Early')."),
  age: z.number().describe("The user's age in years."),
  gender: z.string().describe("The user's gender (e.g., 'Male', 'Female', 'Other')."),
  dietaryPreference: z
    .enum(['Veg', 'Non-Veg', 'Both'])
    .describe("The user's dietary preference."),
  userQuery: z
    .string()
    .optional()
    .describe(
      "An optional specific request from the user regarding diet or exercise preferences."
    ),
});

export const HealthyTipsOutputSchema = z.object({
  exerciseTips: z
    .array(z.string())
    .describe('A list of recommended exercises suitable for the user.'),
  dailyDiet: z
    .object({
      breakfast: z.string().describe('Suggestion for breakfast.'),
      lunch: z.string().describe('Suggestion for lunch.'),
      dinner: z.string().describe('Suggestion for dinner.'),
      snacks: z.string().describe('Suggestion for healthy snacks.'),
    })
    .describe('A sample daily diet plan.'),
  weeklyDietPlan: z
    .array(
      z.object({
        day: z.string().describe('The day of the week (e.g., Monday).'),
        meals: z.string().describe('A brief description of meals for that day.'),
      })
    )
    .describe('A sample meal plan for a week.'),
  monthlyDietPlan: z
    .array(
      z.object({
        week: z.string().describe("The week number (e.g., 'Week 1')."),
        focus: z
          .string()
          .describe('The dietary focus or theme for that week.'),
      })
    )
    .describe('A sample high-level meal plan for a month, broken down by week.'),
  thingsToAvoid: z
    .array(z.string())
    .describe(
      'A list of foods, ingredients, or habits the user should avoid.'
    ),
});

export interface EndUserProfile {
  role: 'enduser';
  userId: string;
  uniqueId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  diseName?: string;
  stage?: string;
  bloodType?: string;
  state?: string;
  city?: string;
  documents: Document[];
  sessions: SessionComment[];
  prescriptions?: PrescriptionRecord[];
  accessRequests: AccessRequest[];
  reminders?: Reminder[];
  preferredLanguage?: string;
  dietaryPreference?: 'Veg' | 'Non-Veg' | 'Both';
  lastLoginAt?: string;
  createdAt?: string;
}

export interface ConsultantProfile {
  role: 'consultant';
  consultantId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  qualification: string;
  qualificationNumber: string;
  totalExperience: number; // years
  specializationField: string;
  attendedUsers: {userId: string; name: string; lastViewed: string}[];
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AdminProfile {
  role: 'admin';
  adminId: string;
  name: string;
  email: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  profile: EndUserProfile | ConsultantProfile | AdminProfile;
}

export interface InsurancePolicy {
  id: string;
  companyName: string;
  policyType: string;
  insuredAmount: number;
  policyDocument: {
    name: string;
    dataUri: string;
  };
  createdAt: string;
}
