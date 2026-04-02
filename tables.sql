-- CAMPUSES
CREATE TABLE campuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(255)
);

-- FACULTIES
CREATE TABLE faculties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    campus_id INT,
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- COURSES
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    faculty_id INT,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clerkid VARCHAR(255) UNIQUE,
    role VARCHAR(100),
    registration_number VARCHAR(255),
    campus_id INT,
    course_id INT,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (campus_id) REFERENCES campuses(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    FOREIGN KEY (course_id) REFERENCES courses(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- courses
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    campus_id INT,
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- DISSERTATIONS
CREATE TABLE dissertations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    author_name VARCHAR(255),
    abstract TEXT,
    year INT,
    methodology VARCHAR(255),
    supervisor VARCHAR(255),
    pages INT,
    file_size VARCHAR(50),
    file_url TEXT,
    courses_id INT,
    uploaded_by INT,
    FOREIGN KEY (courses_id) REFERENCES courses(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- BOOKMARKS
CREATE TABLE bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    dissertation_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (dissertation_id) REFERENCES dissertations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- DOWNLOADS
CREATE TABLE downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    dissertation_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (dissertation_id) REFERENCES dissertations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- IMAGES
CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);