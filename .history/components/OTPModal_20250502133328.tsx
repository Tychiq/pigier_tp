"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { verifySecret, sendEmailOTP } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";

const OtpModal = ({
  accountId,
  email,
  isStudent,
}: {
  accountId: string;
  email: string;
  isStudent: boolean;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState(""); // OTP input state
  const [isLoading, setIsLoading] = useState(false); // For submission button loading
  const [isResending, setIsResending] = useState(false); // For handling OTP resend loading state
  const [error, setError] = useState<string | null>(null); // Error state for OTP verification

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Reset any previous errors before submission
  
    try {
      const sessionId = await verifySecret({ accountId, password });
  
      if (sessionId) {
        if (isStudent) {
          router.push("/student"); // Redirect student
        } else {
          router.push("/"); // Redirect general user
        }
        setIsOpen(false); // Close the modal after successful submission
      }
    } catch (error) {
      console.log("Erreur lors de la vérification de l'OTP", error);
      setError("Le code OTP est invalide ou a expiré."); // Set the error message
    }
  
    setIsLoading(false); // Reset loading state
  };

  const handleResendOtp = async () => {
    setIsResending(true); // Set resend loading state
    setError(null); // Reset any error state
    try {
      await sendEmailOTP({ email });
    } catch (error) {
      console.log("Erreur lors de l'envoi du code", error);
      setError("Une erreur est survenue lors de l'envoi du code."); // Display resend error
    }
    setIsResending(false); // Reset resend loading state
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader className="relative flex justify-center">
          <AlertDialogTitle className="h2 text-center">
            Entrez votre OTP
            <Image
              src="/assets/icons/close-dark.svg"
              alt="close"
              width={20}
              height={20}
              onClick={() => setIsOpen(false)}
              className="otp-close-button"
            />
          </AlertDialogTitle>
          <AlertDialogDescription className="subtitle-2 text-center text-light-100">
            Nous avons envoyé un code à{" "}
            <span className="pl-1 text-brand">{email}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <InputOTP maxLength={6} value={password} onChange={setPassword}>
          <InputOTPGroup className="shad-otp">
            <InputOTPSlot index={0} className="shad-otp-slot" />
            <InputOTPSlot index={1} className="shad-otp-slot" />
            <InputOTPSlot index={2} className="shad-otp-slot" />
            <InputOTPSlot index={3} className="shad-otp-slot" />
            <InputOTPSlot index={4} className="shad-otp-slot" />
            <InputOTPSlot index={5} className="shad-otp-slot" />
          </InputOTPGroup>
        </InputOTP>

        {error && (
          <div className="text-red-500 text-center mt-2">{error}</div> // Error message
        )}

        <AlertDialogFooter>
          <div className="flex w-full flex-col gap-4">
            <AlertDialogAction
              onClick={handleSubmit}
              className="shad-submit-btn h-12"
              type="button"
              disabled={isLoading || password.length !== 6} // Disable if OTP length is not 6
            >
              Soumettre
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="ml-2 animate-spin"
                />
              )}
            </AlertDialogAction>

            <div className="subtitle-2 mt-2 text-center text-light-100">
              Vous n&apos;avez pas reçu un code?
              <Button
                type="button"
                variant="link"
                className="pl-1 text-brand"
                onClick={handleResendOtp}
                disabled={isResending} // Disable resend button while loading
              >
                {isResending ? "Envoi en cours..." : "Cliquez pour renvoyer"}
              </Button>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OtpModal;
