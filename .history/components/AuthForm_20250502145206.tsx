"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createAccount, signInUser } from "@/lib/actions/user.actions";
import OtpModal from "@/components/OTPModal";
import { useRouter } from "next/navigation";

type FormType = "sign-in" | "sign-up";

// Schema
const getAuthFormSchema = (formType: FormType) =>
  z.object({
    email: z.string().email(),
    fullName: formType === "sign-up" ? z.string().min(2).max(50) : z.string().optional(),
    isStudent: formType === "sign-up" ? z.boolean() : z.boolean().optional(),
  });

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);

  const formSchema = getAuthFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullName: "",
      isStudent: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user =
        type === "sign-up"
          ? await createAccount({
              fullName: values.fullName || "",
              email: values.email,
              isStudent: values.isStudent ?? false,
            })
          : await signInUser({ email: values.email });

      setAccountId(user.accountId);
      setIsStudent(user.isStudent ?? false);

      // For sign-in, redirect immediately
      if (type === "sign-in") {
        if (user.isStudent) {
          router.push("/student");
        } else {
          router.push("/dashboard");
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrorMessage("Échec lors de la création de compte ou de la connexion. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title">
            {type === "sign-in" ? "Connexion" : "S'inscrire"}
          </h1>

          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form-label">Nom Complet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Entrez votre nom complet"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form-label">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Entrez votre email"
                    className="shad-input"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="isStudent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="shad-form-label">Vous êtes étudiant(e)?</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={field.value === true}
                          onChange={() => field.onChange(true)}
                        />
                        <span>Oui</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={field.value === false}
                          onChange={() => field.onChange(false)}
                        />
                        <span>Non</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            className="form-submit-button"
            disabled={isLoading}
          >
            {type === "sign-in" ? "Connexion" : "S'inscrire"}
            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                width={24}
                height={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>

          {errorMessage && <p className="error-message">*{errorMessage}</p>}

          <div className="body-2 flex justify-center">
            <p className="text-light-100">
              {type === "sign-in"
                ? "N'avez-vous pas encore un compte?"
                : "Déjà enregistré(e)?"}
            </p>
            <Link
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}
              className="ml-1 font-medium text-brand"
            >
              {type === "sign-in" ? "S'inscrire" : "Connexion"}
            </Link>
          </div>
        </form>
      </Form>

      {type === "sign-up" && accountId && (
        <OtpModal
          email={form.getValues("email")}
          accountId={accountId}
          isStudent={isStudent}
        />
      )}
    </>
  );
};

export default AuthForm;
