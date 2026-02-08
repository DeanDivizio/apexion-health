import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <SignUp
        appearance={{
          baseTheme: dark,
          variables: {
            colorBackground: "#0a0a0a",
            colorInputBackground: "#171717",
            colorInputText: "#fafafa",
            colorText: "#fafafa",
            colorTextSecondary: "#a3a3a3",
            colorPrimary: "#27e476",
            colorDanger: "#ef4444",
            borderRadius: "0.5rem",
          },
          elements: {
            rootBox: "mx-auto",
            card: "bg-neutral-950 border border-neutral-800 shadow-xl shadow-green-950/10",
            headerTitle: "text-white",
            headerSubtitle: "text-neutral-400",
            socialButtonsBlockButton:
              "bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800",
            socialButtonsBlockButtonText: "text-neutral-200",
            dividerLine: "bg-neutral-800",
            dividerText: "text-neutral-500",
            formFieldLabel: "text-neutral-300",
            formFieldInput:
              "bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500",
            formFieldInputShowPasswordButton: "text-neutral-400 hover:text-neutral-200",
            footerActionLink: "text-emerald-400 hover:text-emerald-300",
            footerActionText: "text-neutral-400",
            identityPreviewText: "text-neutral-300",
            identityPreviewEditButton: "text-emerald-400 hover:text-emerald-300",
            formButtonPrimary:
              "bg-emerald-600 hover:bg-emerald-500 text-white",
            alertText: "text-neutral-300",
            formFieldWarningText: "text-amber-400",
            formFieldSuccessText: "text-emerald-400",
            otpCodeFieldInput: "bg-neutral-900 border-neutral-700 text-white",
          },
        }}
      />
    </main>
  );
}
