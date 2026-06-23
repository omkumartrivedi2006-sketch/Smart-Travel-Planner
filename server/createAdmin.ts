import mongoose from "mongoose";
import { User } from "./models/User";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "System Admin";

  if (!email || !password) {
    console.log("\nUsage: npx tsx server/createAdmin.ts <email> <password> [name]\n");
    process.exit(1);
  }

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error("Error: MONGODB_URI is not set in your .env file!");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongodbUri);

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      console.log(`User with email "${email}" already exists. Promoting to admin...`);
      user.role = "admin";
      // We must specify the password if we save, but it might not be loaded. 
      // If we just do an update, we don't trigger the pre-save password hashing hook on undefined password.
      await User.updateOne({ email }, { $set: { role: "admin" } });
      console.log(`\n✅ User "${email}" has been successfully promoted to ADMIN.`);
    } else {
      console.log(`Creating new admin user: "${email}"...`);
      user = await User.create({
        name,
        email,
        password,
        role: "admin",
      });
      console.log(`\n✅ Admin user "${email}" created successfully.`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating/promoting admin:", error);
    process.exit(1);
  }
}

createAdmin();
