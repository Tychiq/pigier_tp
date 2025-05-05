"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "@/constants";
import { redirect } from "next/navigation";

// Get user document by email
const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", [email])]
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw new Error(message); // More informative error message
};

// Send Email OTP for user verification
export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (error) {
    handleError(error, "Erreur lors de l'envoi de l'OTP");
  }
};

// Create user account with additional support for `isStudent` flag
export const createAccount = async ({
  fullName,
  email,
  isStudent,
}: {
  fullName: string;
  email: string;
  isStudent: boolean;
}) => {
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    // Handle the case where the user already exists
    throw new Error("Utilisateur déjà existant");
  }

  // Send OTP to the email address
  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Erreur lors de l'envoi de l'OTP");

  // Create a new user document if it doesn't exist
  const { databases } = await createAdminClient();

  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    ID.unique(),
    {
      fullName,
      email,
      avatar: avatarPlaceholderUrl,
      accountId,
      isStudent, // Store the `isStudent` flag
    }
  );

  return parseStringify({ accountId, isStudent });
};

// Verify OTP and create session for the user
export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession(accountId, password);

    // Set session cookie
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Echec de vérification de l'OTP");
  }
};

// Get the current logged-in user by fetching the session and user document
export const getCurrentUser = async () => {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();  // This will throw an error if the session is invalid
    return result;
  } catch (error) {
    console.error("User not authenticated or session expired", error);
    return null;
  }
};

// When getting files, check if the user is authenticated first
export const getFiles = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Utilisateur introuvable");
  }
  // Proceed with file fetching logic
};

// Sign out user and clear the session cookie
export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Echec lors de la déconnexion");
  } finally {
    redirect("/sign-in"); // Redirect to sign-in page after logout
  }
};

// Sign in user by email and return necessary details including `isStudent`
export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    // If the user exists, send OTP
    if (existingUser) {
      await sendEmailOTP({ email });

      // Return the user data including `accountId` and `isStudent`
      return parseStringify({
        accountId: existingUser.accountId,
        isStudent: existingUser.isStudent ?? false, // Default to `false` if no value
      });
    }

    // If user does not exist, return error
    return parseStringify({ accountId: null, error: "Utilisateur non identifié(e)" });
  } catch (error) {
    handleError(error, "Erreur lors de la connexion de l'utilisateur");
  }
};

// Handle successful registration and redirect to appropriate page
export const handleRegistrationSuccess = async (accountId: string) => {
  const { databases } = await createAdminClient();
  const user = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("accountId", accountId)]
  );

  if (user.total > 0) {
    const userDocument = user.documents[0];
    // If the user is a student, redirect to student dashboard
    if (userDocument.isStudent) {
      redirect("/student"); // Redirect student to their page
    } else {
      redirect("/"); // Otherwise, redirect to the general dashboard
    }
  }
};

// Verify if the session is valid or expired
export const verifySession = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Session has expired or user is not authenticated");
    }
    return currentUser;
  } catch (error) {
    console.error("Session verification failed:", error);
    throw new Error("Session verification failed");
  }
};
