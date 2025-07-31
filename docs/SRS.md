# Software Requirements Specification (SRS) for MyDocula

## 1. Introduction

### 1.1 Purpose

This document provides a detailed description of the software requirements for the MyDocula platform. It outlines the functional and non-functional requirements, system architecture, and constraints. This SRS is intended for the development team to guide the design, implementation, and testing of the software.

### 1.2 Scope

The software is a web-based application built on the Next.js framework with a Firebase backend. It will provide three distinct user interfaces for End-Users, Consultants, and Administrators. The scope is defined by the features and functionalities described in this document.

### 1.3 Definitions, Acronyms, and Abbreviations

- **BRD:** Business Requirements Document
- **SRS:** Software Requirements Specification
- **UI:** User Interface
- **UX:** User Experience
- **AI:** Artificial Intelligence
- **OCR:** Optical Character Recognition
- **EHR:** Electronic Health Record
- **Firebase:** Backend-as-a-Service platform by Google
- **Firestore:** NoSQL database in the Firebase suite
- **Genkit:** An open-source AI framework used for building AI-powered features.
- **Data URI:** A URI scheme that provides a way to include data in-line in web pages as if they were external resources.

## 2. Overall Description

### 2.1 Product Perspective

MyDocula is a self-contained, patient-centric health record management system. It operates independently of existing hospital or clinic EHRs. Its primary function is to aggregate medical documents provided by the user and facilitate controlled access for consulting healthcare professionals.

### 2.2 Product Features

The major features of the MyDocula platform are:
- **User Authentication:** Secure registration and login for all user roles.
- **Role-Based Dashboards:** Tailored dashboards providing relevant tools and information for each user role.
- **Document Management Module:** For uploading, storing, viewing, and managing medical documents.
- **AI Summarization & OCR Module:** For extracting and structuring text from documents.
- **Access Control System:** For managing data-sharing permissions between users and consultants.
- **Reminder & Prescription Module:** For creating and managing health-related reminders.
- **AI Health Tips Module:** For generating personalized wellness advice.
- **Admin Management Panel:** A suite of tools for platform administration.

### 2.3 User Classes and Characteristics

- **End-Users:** Individuals who want to manage their health records. They may have varying levels of technical proficiency but expect a simple, intuitive interface. They are primarily concerned with data privacy and ease of access.
- **Consultants:** Licensed healthcare professionals. They are tech-savvy in a clinical context but require an efficient, no-nonsense interface to access patient data quickly and securely.
- **Administrators:** Technical or operational staff responsible for platform maintenance. They require powerful tools to manage the user base and ensure the system's integrity.

### 2.4 Operating Environment

The application is a web-based platform designed to run in modern web browsers (e.g., Chrome, Firefox, Safari, Edge) on desktop and mobile devices. The backend infrastructure is fully hosted on Google's Firebase platform.

### 2.5 Design and Implementation Constraints

- **Technology Stack:** The application must be built using Next.js, React, Tailwind CSS, and ShadCN UI components for the frontend. The backend must exclusively use Firebase services (Authentication, Firestore, etc.) and Genkit for AI functionalities.
- **Security:** All data transmission must be encrypted using HTTPS. Sensitive data in the database (Firestore) must be protected using Firebase Security Rules. User passwords must be securely hashed and stored by Firebase Authentication.
- **Data Privacy:** The system must adhere to a strict consent-based model. No user data can be viewed by another user (including consultants) without explicit, logged permission.

## 3. Functional Requirements

### 3.1 User Authentication

- **FR-1.1:** Users shall be able to register for an account by providing a first name, last name, email, password, and selecting a role (End-User or Consultant).
- **FR-1.2:** Users shall be able to log in using their email and password.
- **FR-1.3:** The system shall provide a password reset mechanism via email.
- **FR-1.4:** User sessions shall be managed securely, with users remaining logged in until they explicitly log out.

### 3.2 End-User Module

- **FR-2.1 (Profile):** Users shall be able to view and edit their personal profile information, including contact details, demographics, and health information (e.g., blood type, primary condition).
- **FR-2.2 (Documents):** Users shall be able to upload documents (images, PDFs).
- **FR-2.3 (AI Summarization):** Users shall be able to initiate an AI-powered process on an uploaded document to extract and display a structured summary (Clinic Name, Patient Name, Age, Outcome, etc.).
- **FR-2.4 (Reminders):** Users shall be able to view reminders automatically extracted from prescriptions and manually create, edit, and delete their own custom reminders for medication or appointments.
- **FR-2.5 (Access Control):** Users shall be able to view a list of pending access requests from consultants and approve or deny them. They shall also see a history of approved/denied requests.
- **FR-2.6 (Health Tips):** Users shall be able to generate personalized diet and exercise tips from an AI based on their profile data.

### 3.3 Consultant Module

- **FR-3.1 (Profile):** Consultants shall be able to view and edit their professional profile, including qualifications, specialization, and experience.
- **FR-3.2 (User Search):** Consultants shall be able to search for an end-user using their unique ID.
- **FR-3.3 (Access Request):** If a consultant does not have access to a user's profile, they must be able to send an access request. The system shall prevent further requests if the user has declined a certain number of times (e.g., 3).
- **FR-3.4 (User Data Viewing):** Once access is granted, the consultant shall be able to view the user's profile information and all their uploaded documents. Access shall expire after a set duration (e.g., 1 hour).
- **FR-3.5 (Session Notes):** Consultants shall be able to write and add new session notes or comments to the user's profile.
- **FR-3.6 (Prescriptions):** Consultants shall be able to write a prescription, enhance it using AI for clarity, and save it to the user's profile, which will automatically generate reminders for the user.

### 3.4 Administrator Module

- **FR-4.1 (User Management):** Admins shall be able to view lists of all end-users, consultants, and other admins on the platform.
- **FR-4.2 (Consultant Creation):** Admins shall be able to create new consultant accounts on behalf of professionals.
- **FR-4.3 (Access Oversight):** Admins shall have a global view of all access requests across the platform and be able to manually approve, revoke, or reset rejection counts for any request.
- **FR-4.4 (Insurance Management):** Admins shall be able to add, view, and delete insurance policies that are displayed to end-users.
- **FR-4.5 (Data Explorer):** Admins shall be able to view raw, read-only JSON data from the main Firestore collections for debugging and oversight.

## 4. Non-Functional Requirements

### 4.1 Performance

- **NFR-1.1:** Web pages must load in under 3 seconds on a standard broadband connection.
- **NFR-1.2:** AI-powered operations (summarization, text extraction) should complete within 15 seconds. The UI must provide clear loading indicators during these processes.
- **NFR-1.3:** The system shall support at least 100 concurrent users without significant performance degradation.

### 4.2 Security

- **NFR-2.1:** All user passwords must be hashed and salted via Firebase Authentication. Direct password access must not be possible.
- **NFR-2.2:** Firestore database access must be strictly controlled via Firebase Security Rules, ensuring users can only read/write data they are authorized to access.
- **NFR-2.3:** All data in transit between the client and server must be encrypted using TLS/SSL (HTTPS).

### 4.3 Usability

- **NFR-3.1:** The user interface must be responsive and adapt gracefully to various screen sizes, including desktops, tablets, and mobile phones.
- **NFR-3.2:** The application must be intuitive and easy to navigate for users with basic computer literacy.
- **NFR-3.3:** The platform shall provide clear feedback for user actions, including loading states, success messages, and error notifications.

### 4.4 Reliability

- **NFR-4.1:** The application shall have an uptime of at least 99.5%.
- **NFR-4.2:** The system must handle errors gracefully and provide informative error messages to the user without crashing.
- **NFR-4.3:** Data backup and recovery will be handled by the underlying Firebase/Google Cloud infrastructure.
