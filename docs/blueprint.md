# **App Name**: Profile Hub

## Core Features:

- Role-Based Authentication: Secure user authentication using JWT for different roles (End User, Consultant, Admin).
- Profile Management: Create and manage user profiles with fields: First Name, Last Name, Email, Phone Number, Age, Gender, and more. Separate profile creation for Consultants, as described by the user.
- Document Management: Secure document uploads with options for users to rename and view uploaded documents.
- Document Scanning (OCR): OCR integration (using Tesseract.js, the LLM tool that reads uploaded documents) to scan documents and extract text into digital format for storage and manipulation. NOTE: Limited in this proposal, due to constraints. See limitations in Considerations, below.
- Profile Display: Display profile information and uploaded documents in a clear and organized manner, following good UI practices.

## Style Guidelines:

- Primary color: A deep blue (#3F51B5) to convey trust and security, fitting for a platform handling sensitive user data.
- Background color: Light gray (#F0F2F5), providing a clean and neutral backdrop.
- Accent color: A vivid purple (#9C27B0) to highlight interactive elements and CTAs, adding a touch of sophistication.
- Font pairing: 'Inter' (sans-serif) for both headlines and body text. Inter offers a clean, modern look suitable for a professional profile management application.
- Use modern and simple icons from a library like FontAwesome or Material Icons, to represent profile actions, document types, and settings.
- Employ a clean, card-based layout with clear visual hierarchy to display profile information and documents, making the interface intuitive for users with varying levels of tech proficiency.
- Subtle transitions and feedback animations for actions like uploading documents or saving profile changes to improve user experience without being distracting.