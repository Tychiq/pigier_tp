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
    [Query.equal("email", [email])],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
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

  // Send OTP to the email address
  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Erreur lors de l'envoi de l'OTP");

  // Create new user document if it doesn't exist
  if (!existingUser) {
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
      },
    );
  }

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
    const { databases, account } = await createSessionClient();

    // Ensure user is authenticated by checking the session
    const result = await account.get();

    // Fetch user document from the database
    const user = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountId", result.$id)],
    );

    // Return null if user not found
    if (user.total <= 0) return null;

    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error);
    return null; // Ensure graceful failure if session is invalid or expired
  }
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

      return parseStringify({
        accountId: existingUser.accountId,
        isStudent: existingUser.isStudent ?? false, // Default to `false` if no value
      });
    }

    // Return error if user does not exist
    return parseStringify({ accountId: null, error: "Utilisateur non identifié(e)" });
  } catch (error) {
    handleError(error, "Erreur lors de l'enregistrement de l'utilisateur");
  }
};
