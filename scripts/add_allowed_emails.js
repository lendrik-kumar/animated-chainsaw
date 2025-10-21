import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Allowed } from '../models/allowed.model.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect("");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        // Read and parse CSV file
        const csvFilePath = path.join(__dirname, 'sample.csv');
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        
        const records = parse(fileContent, {
            skip_empty_lines: true,
            trim: true
        });

        // Transform data to match schema
        const allowedUsers = records.map(([name, email, phone]) => ({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim()
        }));

        // Filter out existing emails
        const uniqueUsers = [];
        const duplicateEmails = [];

        for (const user of allowedUsers) {
            const exists = await Allowed.findOne({ email: user.email });
            if (!exists) {
                uniqueUsers.push(user);
            } else {
                duplicateEmails.push(user.email);
            }
        }

        if (duplicateEmails.length > 0) {
            console.log('\nSkipping existing emails:', duplicateEmails);
        }

        if (uniqueUsers.length === 0) {
            console.log('No new users to import');
            return;
        }

        // Insert only new users
        const result = await Allowed.insertMany(uniqueUsers, { ordered: false });
        console.log(`\nSuccessfully imported ${result.length} new users`);

    } catch (error) {
        console.error('Error importing data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

importData();