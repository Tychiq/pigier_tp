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

type FormType = "sign-in" | "sign-up";

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z.string().email(),
    fullName:
      formType === "sign-up"
        ? z.string().min(2).max(50)
        : z.string().optional(),
    isStudent: z.enum(["yes", "no"]),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [accountId, setAccountId] = useState(null);
  const [isStudent, setIsStudent] = useState(false);


  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      isStudent: "no",
    },
    
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const user =
        type === "sign-up"
          ? await createAccount({
              fullName: values.fullName || "",
              email: values.email,
              isStudent: values.isStudent === "yes",
            })
          : await signInUser({ email: values.email });

          setAccountId(user.accountId);
          setIsStudent(user.isStudent); 
          
    } catch {
      setErrorMessage("Échec de la création du compte. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title">
            {type === "sign-in" ? "Se connecter" : "S'inscrire"}
          </h1>
          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item">
                    <FormLabel className="shad-form-label">Numero de table</FormLabel>

                    <FormControl>
                      <Input
                        placeholder="Entrez votre numero de table"
                        className="shad-input"
                        {...field}
                      />
                    </FormControl>
                  </div>

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
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Email</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Entrez votre email"
                      className="shad-input"
                      {...field}
                    />
                  </FormControl>
                </div>

                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />

<FormField
  control={form.control}
  name="isStudent"
  render={({ field }) => (
    <FormItem>
      <FormLabel className="shad-form-label">Êtes-vous un étudiant?</FormLabel>
      <div className="flex gap-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="yes"
            checked={field.value === "yes"}
            onChange={() => field.onChange("yes")}
          />
          <span>Oui</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            value="no"
            checked={field.value === "no"}
            onChange={() => field.onChange("no")}
          />
          <span>Non</span>
        </label>
      </div>
      <FormMessage className="shad-form-message" />
    </FormItem>
  )}
/>


          <Button
            type="submit"
            className="form-submit-button"
            disabled={isLoading}
          >
            {type === "sign-in" ? "Se connecter" : "S'inscrire"}

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
                ? "Vous n'avez pas de compte ?"
                : "Vous avez déjà un compte ?"}
            </p>
            <Link
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}
              className="ml-1 font-medium text-brand"
            >
              {" "}
              {type === "sign-in" ? "S'inscrire" : "Se connecter"}
            </Link>
          </div>
        </form>
      </Form>

      {accountId && (
  <OtpModal
    email={form.getValues("email")}
    accountId={accountId}
    isStudent={isStudent || form.getValues("isStudent") === "yes"}
  />
)}

    </>
  );
};

export default AuthForm;