# Restful-NE
Restful_NE

create table users ( id serial primary key, name varchar(255) not null, email varchar(255) unique not null, password varchar(255),role varchar(50) not null,is_verified varchar(255));

create table vehicles(user_id int not null,foreign key (user_id) references users(id) on delete cascade on update cascade, plate_number varchar(255), vehicle_type varchar(255),size varchar(255),other_attributes varchar(255));

create table otps(user_id int not null,foreign key (user_id) references users(id) on delete cascade on update cascade, otp_code int, expires_at timestamp, is_verified boolean default false);

  CREATE TABLE parking_slots (
       id SERIAL PRIMARY KEY,
       slot_number VARCHAR(10) UNIQUE,
       size VARCHAR(20),
       vehicle_type VARCHAR(50),
       status VARCHAR(20) DEFAULT 'available',
       location VARCHAR(100),
       action VARCHAR(100),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

CREATE TABLE slot_requests (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id),
       vehicle_id INTEGER REFERENCES vehicles(id),
       slot_id INTEGER REFERENCES parking_slots(id),
       request_status VARCHAR(20) DEFAULT 'pending',
       requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       approved_at TIMESTAMP,
       slot_number VARCHAR(10)
     );

CREATE TABLE logs (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id),
       action VARCHAR(100),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );