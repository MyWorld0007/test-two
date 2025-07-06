-- This is a relational SQL schema that represents the data structure of the MyDocula application,
-- which is currently implemented using the NoSQL database Cloud Firestore.

-- =============================================
-- Core User and Profile Tables
-- =============================================

-- The `users` table holds common authentication information for all roles.
-- The `id` is the UID from Firebase Authentication.
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('enduser', 'consultant', 'admin') NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- The `end_user_profiles` table stores data specific to end users.
CREATE TABLE end_user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    unique_id VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    age INT,
    gender ENUM('Male', 'Female', 'Other'),
    dise_name VARCHAR(255),
    stage VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- The `consultant_profiles` table stores data specific to consultants.
CREATE TABLE consultant_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    qualification VARCHAR(255),
    qualification_number VARCHAR(255),
    total_experience INT COMMENT 'Total experience in years',
    specialization_field VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NOTE: Admin-specific data is fully contained within the `users` table.
-- An `admin_profiles` table would be redundant in this schema.


-- =============================================
-- Feature-related Tables
-- =============================================

-- The `documents` table holds metadata for files uploaded by end users.
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    category ENUM('Lab', 'Clinical', 'Hospital', 'Estimate', 'Other') NOT NULL,
    extracted_text TEXT,
    summary TEXT,
    FOREIGN KEY (user_id) REFERENCES end_user_profiles(user_id) ON DELETE CASCADE
);

-- The `session_comments` table stores notes made by consultants on an end user's profile.
CREATE TABLE session_comments (
    id VARCHAR(255) PRIMARY KEY,
    end_user_id VARCHAR(255) NOT NULL,
    consultant_id VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    `timestamp` TIMESTAMP NOT NULL,
    FOREIGN KEY (end_user_id) REFERENCES end_user_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (consultant_id) REFERENCES consultant_profiles(user_id) ON DELETE CASCADE
);

-- The `access_requests` table manages permissions between consultants and end users.
CREATE TABLE access_requests (
    id VARCHAR(255) PRIMARY KEY,
    end_user_id VARCHAR(255) NOT NULL,
    consultant_id VARCHAR(255) NOT NULL,
    consultant_name VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'declined') NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    rejection_count INT DEFAULT 0,
    UNIQUE (end_user_id, consultant_id),
    FOREIGN KEY (end_user_id) REFERENCES end_user_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (consultant_id) REFERENCES consultant_profiles(user_id) ON DELETE CASCADE
);

-- The `insurance_policies` table stores insurance plans managed by the admin.
CREATE TABLE insurance_policies (
    id VARCHAR(255) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(255) NOT NULL,
    insured_amount DECIMAL(15, 2) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL
);


-- =============================================
-- Join Table for Many-to-Many Relationships
-- =============================================

-- The `consultant_attended_users` table tracks which users a consultant has viewed.
CREATE TABLE consultant_attended_users (
    consultant_id VARCHAR(255) NOT NULL,
    end_user_id VARCHAR(255) NOT NULL,
    last_viewed TIMESTAMP NOT NULL,
    PRIMARY KEY (consultant_id, end_user_id),
    FOREIGN KEY (consultant_id) REFERENCES consultant_profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (end_user_id) REFERENCES end_user_profiles(user_id) ON DELETE CASCADE
);
