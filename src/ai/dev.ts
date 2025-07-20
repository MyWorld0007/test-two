
import { config } from 'dotenv';
config();

import '@/ai/flows/scan-document.ts';
import '@/ai/flows/summarize-text-flow.ts';
import '@/ai/flows/extract-reminders-from-prescription.ts';
import '@/ai/flows/enhance-prescription-flow.ts';
import '@/ai/flows/generate-healthy-tips-flow.ts';
