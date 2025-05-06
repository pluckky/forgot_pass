Login controllers
server 
web 

There are alerts sa mga code for checking 
alisin mo nlng if di mo kailangan marti 
al tho prefer ko kasi if may alerts


all should go to their respective folders

Create paswword_reset table for forget pass

CREATE TABLE password_reset(
    email VARCHAR(255) PRIMARY KEY,
    otp_code INT NOT NULL,
    expires_at DATETIME NOT NULL
    FOREIGN KEY (email) REFERENCES user_information(email)
);



