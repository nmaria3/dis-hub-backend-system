-- CAMPUSES
CREATE TABLE campuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(255)
);

-- USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clerkid VARCHAR(255),
    role VARCHAR(100),
    campus_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_id) REFERENCES campuses(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- DEPARTMENTS
CREATE TABLE departments (
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
    degree_type VARCHAR(100),
    supervisor VARCHAR(255),
    pages INT,
    file_size VARCHAR(50),
    file_url TEXT,
    department_id INT,
    uploaded_by INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
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