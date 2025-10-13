CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50),
  password VARCHAR(50)
);
CREATE TABLE tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message VARCHAR(100),
  token VARCHAR(100)
);

INSERT INTO users (username, password) VALUES ('alice','password123'), ('bob','hunter2');

-- token rows: echo stored so UNION can find it
INSERT INTO tokens (message, token) VALUES
('this is the required token','echo');
