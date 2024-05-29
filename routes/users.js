const express = require('express');
const connection = require('../connection');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require ('nodemailer');
var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');



// Signup endpoint
router.post('/signup', (req, res) => {
    const {
        accountNumber,
        phoneNumber,
        idType,
        idNumber,
        password,
        accountName,
        emailAddress,
        confirmKRAPin,
        perTransactionLimit,
        dailyTransactionLimit,
        KRAPin,
        username
    } = req.body;

    // Check for duplicate account number or email
    connection.query('SELECT * FROM users WHERE accountNumber = ? OR emailAddress = ?', [accountNumber, emailAddress], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).send({ message: 'Server error' });
        }
        if (results.length > 0) {
            return res.status(400).send({ message: 'Account number or email already exists' });
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing the password:', err);
                return res.status(500).send({ message: 'Error hashing password' });
            }

            // Insert the new user into the database
            const query = 'INSERT INTO users (accountNumber, phoneNumber, idType, idNumber, password, accountName, emailAddress, confirmKRAPin, perTransactionLimit, dailyTransactionLimit, KRAPin, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            connection.query(query, [accountNumber, phoneNumber, idType, idNumber, hashedPassword, accountName, emailAddress, confirmKRAPin, perTransactionLimit, dailyTransactionLimit, KRAPin, username], (err, results) => {
                if (err) {
                    console.error('Error inserting the user:', err);
                    return res.status(500).send({ message: 'Error inserting user' });
                }
                res.status(201).send({ message: 'User registered successfully' });
            });
        });
    });
});


// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`Received login request for email: ${email}`);

    const query = "SELECT password FROM users WHERE emailAddress = ?";
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ message: "Something went wrong. Please try again later" });
        }

        if (results.length <= 0) {
            console.log("No user found with the given email.");
            return res.status(401).json({ message: "Incorrect Email Address or Password" });
        }

        const hashedPassword = results[0].password;

        // Compare the hashed password
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return res.status(500).json({ message: "Something went wrong. Please try again later" });
            }

            if (!isMatch) {
                console.log("Password mismatch.");
                return res.status(401).json({ message: "Incorrect Email Address or Password" });
            }

            console.log("Login successful.");
            res.status(200).json({ message: "Login successful" });
        });
    });
});

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "earvinekinyua@gmail.com",
        pass: "eosbgrnqgysxkdvsh"
    }
});


// Forgot password endpoint
router.post('/forgotPassword', (req, res) => {
    const { emailAddress } = req.body;

    if (!emailAddress) {
        return res.status(400).json({ message: "Email is required" });
    }

    const query = "SELECT emailAddress, password FROM users WHERE emailAddress = ?";
    connection.query(query, [emailAddress], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ message: "Something went wrong. Please try again later" });
        }

        if (results.length <= 0) {
            console.log("No user found with the given email.");
            return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.emailAddress,
            subject: 'Password Recovery - Faulu Banking',
            html: `<p><b>Your Password:</b> ${user.password}</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email sending error:', error);
                return res.status(500).json({ message: "Failed to send email. Please try again later." });
            } else {
                console.log('Email sent:', info.response);
                return res.status(200).json({ message: "Password sent successfully to your email." });
            }
        });
    });
});

// Get users endpoint
router.get('/get', (req, res) => {
    var query = "SELECT idusers, accountName, emailAddress, phoneNumber FROM users";
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        } else {
            return res.status(500).json(err);
        }
    });
});


// Endpoint to update dailyTransactionLimit
router.patch('/update-daily-limit', (req, res) => {
    const { emailAddress, dailyTransactionLimit } = req.body;
    
    // Check if emailAddress and dailyTransactionLimit are provided
    if (!emailAddress || !dailyTransactionLimit) {
        return res.status(400).json({ message: "Email address and daily transaction limit are required" });
    }

    // SQL query to update dailyTransactionLimit
    const query = "UPDATE users SET dailyTransactionLimit = ? WHERE emailAddress = ?";
    connection.query(query, [dailyTransactionLimit, emailAddress], (err, results) => {
        if (!err) {
            // Check if any rows were affected by the update
            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "User email does not exist" });
            } else {
                return res.status(200).json({ message: "Daily transaction limit updated successfully" });
            }
        } else {
            console.error('Database query error:', err);
            return res.status(500).json({ error: "An error occurred while updating daily transaction limit" });
        }
    });
});




// Check token endpoint
router.get('/checkToken', (req, res) => {
    return res.status(200).json({ message: "true" });
});


// Change password endpoint
router.post('/changePassword', (req, res) => {
    const { emailAddress, newPassword } = req.body;

    if (!emailAddress || !newPassword) {
        return res.status(400).json({ message: "User email and new password are required" });
    }

    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing the password:', err);
            return res.status(500).json({ message: 'Error hashing password' });
        }

        const query = "UPDATE users SET password=? WHERE emailAddress=?";
        connection.query(query, [hashedPassword, emailAddress], (err, results) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ message: 'Database update error' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "User email does not exist" });
            }

            return res.status(200).json({ message: "Password updated successfully" });
        });
    });
});

router.get('/checkToken',(req,res)=>{
    return res.status(200).json({message:"true"});
})


module.exports = router;